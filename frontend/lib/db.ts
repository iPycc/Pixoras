import type { Project } from "@/types/project"
import { decodeRle, encodeRle } from "@/lib/rle"
import { shortId } from "@/lib/id"
import { defaults } from "@/types/pattern"

const DB_NAME = "pixoras"
const STORE = "projects"
const VERSION = 1

type Stored = Omit<Project, "cells"> & {
  cells?: number[]
  rle?: number[]
}

function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "id" })
        store.createIndex("updatedAt", "updatedAt")
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function done<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function committed(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error)
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function listProjects() {
  const database = await open()
  try {
    const request = database.transaction(STORE).objectStore(STORE).getAll()
    const projects = (await done(request)) as Stored[]
    return projects.map(restore).sort((a, b) => b.updatedAt - a.updatedAt)
  } finally {
    database.close()
  }
}

export async function getProject(id: string) {
  const database = await open()
  try {
    const request = database.transaction(STORE).objectStore(STORE).get(id)
    const project = (await done(request)) as Stored | undefined
    return project ? restore(project) : null
  } finally {
    database.close()
  }
}

export async function saveProject(project: Project) {
  const database = await open()
  try {
    const transaction = database.transaction(STORE, "readwrite")
    const complete = committed(transaction)
    transaction.objectStore(STORE).put(store(project))
    await complete
  } finally {
    database.close()
  }
}

export async function deleteProject(id: string) {
  const database = await open()
  try {
    const transaction = database.transaction(STORE, "readwrite")
    const complete = committed(transaction)
    transaction.objectStore(STORE).delete(id)
    await complete
  } finally {
    database.close()
  }
}

export function projectBlob(project: Project) {
  const { source: _source, ...serializable } = store(project)
  void _source
  return new Blob([JSON.stringify(serializable)], {
    type: "application/json;charset=utf-8",
  })
}

export async function readProject(file: File): Promise<Project> {
  const value = JSON.parse(await file.text()) as Partial<Stored>
  if (
    value.version !== 1 ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    (!Array.isArray(value.cells) && !Array.isArray(value.rle)) ||
    !Array.isArray(value.colors) ||
    !value.settings
  ) {
    throw new Error("这不是有效的 Pixoras 项目文件")
  }
  return {
    ...restore(value as Stored),
    source: undefined,
    id: shortId(),
    updatedAt: Date.now(),
  }
}

function store(project: Project): Stored {
  const { cells, ...metadata } = project
  return { ...metadata, rle: encodeRle(cells) }
}

function restore(project: Stored): Project {
  const length = project.width * project.height
  const cells = project.rle
    ? Array.from(decodeRle(project.rle, length))
    : project.cells
  if (!cells || cells.length !== length) {
    throw new Error("图纸尺寸与数据不匹配")
  }
  const { rle: _rle, ...metadata } = project
  void _rle
  return {
    ...metadata,
    settings: { ...defaults, ...metadata.settings },
    cells,
  } as Project
}
