"use client"

import * as React from "react"
import { PaintBoardIcon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Nav } from "@/components/app/nav"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getPalette } from "@/data/palettes"
import { CropDialog } from "@/features/crop/dialog"
import { Canvas } from "@/features/editor/canvas"
import { Palette } from "@/features/editor/palette"
import { Toolbar } from "@/features/editor/toolbar"
import { ExportDialog } from "@/features/export/dialog"
import { Settings } from "@/features/generate/settings"
import { EditorTour } from "@/features/onboarding/editor-tour"
import { Upload } from "@/features/upload/upload"
import { getProject, saveProject } from "@/lib/db"
import { shortId } from "@/lib/id"
import { imageSize, readImage } from "@/lib/image"
import { replace } from "@/lib/pattern/edit"
import { runWorker } from "@/lib/worker"
import type { BeadColor } from "@/types/bead"
import {
  defaults,
  type BeadShape,
  type Pattern,
  type Settings as Values,
  type Tool,
} from "@/types/pattern"
import type { Project } from "@/types/project"

interface CropSource {
  file: File
  url: string
}

const EDITOR_TOUR_COMPLETE = "pixoras.editor-tour.complete.v1"
const EDITOR_TOUR_PENDING = "pixoras.editor-tour.pending.v1"

export function App({ id }: { id: string }) {
  const router = useRouter()
  const [file, setFile] = React.useState<File | null>(null)
  const [sourceName, setSourceName] = React.useState("")
  const [name, setName] = React.useState("未命名图纸")
  const [settings, setSettings] = React.useState(defaults)
  const [pattern, setPattern] = React.useState<Pattern | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [booting, setBooting] = React.useState(id !== "new")
  const [tool, setTool] = React.useState<Tool>("paint")
  const [shape, setShape] = React.useState<BeadShape>("square")
  const [selected, setSelected] = React.useState(1)
  const [highlight, setHighlight] = React.useState<number | null>(null)
  const [zoom, setZoom] = React.useState(100)
  const [past, setPast] = React.useState<Pattern[]>([])
  const [future, setFuture] = React.useState<Pattern[]>([])
  const [projectId, setProjectId] = React.useState("")
  const activeProjectId = React.useRef("")
  const [createdAt, setCreatedAt] = React.useState(0)
  const [updatedAt, setUpdatedAt] = React.useState(0)
  const [cropSource, setCropSource] = React.useState<CropSource | null>(null)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [tourOpen, setTourOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [paletteOpen, setPaletteOpen] = React.useState(false)

  const generate = React.useCallback(
    async (source: File | null = file, values: Values = settings) => {
      if (!source) return
      setLoading(true)
      try {
        const image = await readImage(source, values)
        const colors = getPalette(values.palette).colors
        const next = await runWorker(image, colors, values)
        setPattern(next)
        setUpdatedAt(Date.now())
        setPast([])
        setFuture([])
        setSelected(firstColor(next))
        toast.success("图纸已生成")
        return next
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "图片转换失败")
      } finally {
        setLoading(false)
      }
    },
    [file, settings]
  )

  const load = React.useCallback((project: Project) => {
    const next: Pattern = {
      width: project.width,
      height: project.height,
      cells: Uint16Array.from(project.cells),
      colors: project.colors,
    }
    const restoredSource = project.source
      ? project.source instanceof File
        ? project.source
        : new File([project.source], `${project.name}-crop.png`, {
            type: project.source.type || "image/png",
          })
      : null
    setPattern(next)
    setFile(restoredSource)
    setSourceName(project.sourceName)
    setName(project.name)
    setSettings(project.settings)
    setShape(project.shape ?? "square")
    activeProjectId.current = project.id
    setProjectId(project.id)
    setCreatedAt(project.createdAt)
    setUpdatedAt(project.updatedAt)
    setSelected(firstColor(next))
    setPast([])
    setFuture([])
    setBooting(false)
  }, [])

  React.useEffect(() => {
    if (id === "new" || id === activeProjectId.current) return
    let active = true
    getProject(id)
      .then((project) => {
        if (!active) return
        if (project) load(project)
        else {
          setBooting(false)
          toast.error("没有找到这个本地作品，可重新选择图片开始")
        }
      })
      .catch(() => {
        if (!active) return
        setBooting(false)
        toast.error("无法读取这个本地作品")
      })
    return () => {
      active = false
    }
  }, [id, load])

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [id])

  React.useEffect(() => {
    if (!pattern) return
    try {
      const pendingProject = window.sessionStorage.getItem(EDITOR_TOUR_PENDING)
      const complete = window.localStorage.getItem(EDITOR_TOUR_COMPLETE) === "1"
      if (pendingProject !== id || complete) return
      const timer = window.setTimeout(() => setTourOpen(true), 420)
      return () => window.clearTimeout(timer)
    } catch {
      return
    }
  }, [id, pattern])

  React.useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource.url)
    }
  }, [cropSource])

  const openFile = async (next: File) => {
    const sample = next.name === "pixoras-demo.svg"
    if (
      !sample &&
      !["image/png", "image/jpeg", "image/webp"].includes(next.type)
    ) {
      toast.error("请选择 PNG、JPEG 或 WebP 图片")
      return
    }
    if (next.size > 25 * 1024 * 1024) {
      toast.error("图片不能超过 25MB")
      return
    }
    try {
      if (sample) {
        if (cropSource) URL.revokeObjectURL(cropSource.url)
        setCropSource({ file: next, url: URL.createObjectURL(next) })
        return
      }
      const dimensions = await imageSize(next)
      const tooLarge = dimensions.width > 8192 || dimensions.height > 8192
      if (tooLarge) {
        toast.error("图片最大解码尺寸为 8192 × 8192")
        return
      }
    } catch {
      toast.error("浏览器无法解码这张图片")
      return
    }
    if (cropSource) URL.revokeObjectURL(cropSource.url)
    setCropSource({ file: next, url: URL.createObjectURL(next) })
  }

  const applyCrop = async (
    next: File,
    size: { width: number; height: number }
  ) => {
    const source = cropSource
    if (!source) return
    const baseName = source.file.name.replace(/\.[^.]+$/, "") || "未命名图纸"
    const nextSettings = { ...settings, ...size, lockRatio: true }
    const nextId = shortId()
    const now = Date.now()
    setCropSource(null)
    URL.revokeObjectURL(source.url)
    setFile(next)
    setSourceName(source.file.name)
    setName(baseName)
    setSettings(nextSettings)
    setProjectId(nextId)
    setCreatedAt(now)
    setUpdatedAt(now)
    const generated = await generate(next, nextSettings)
    if (!generated) return

    let shouldStartTour = true
    try {
      shouldStartTour =
        window.localStorage.getItem(EDITOR_TOUR_COMPLETE) !== "1"
      if (shouldStartTour)
        window.sessionStorage.setItem(EDITOR_TOUR_PENDING, nextId)
    } catch {
      // Storage can be unavailable in private browsing; the in-memory tour still works.
    }
    const savedAt = Date.now()
    const project: Project = {
      version: 1,
      id: nextId,
      name: baseName,
      sourceName: source.file.name,
      source: next,
      width: generated.width,
      height: generated.height,
      cells: Array.from(generated.cells),
      colors: generated.colors,
      shape,
      settings: nextSettings,
      createdAt: now,
      updatedAt: savedAt,
    }
    try {
      await saveProject(project)
      activeProjectId.current = nextId
      setUpdatedAt(savedAt)
      router.replace(`/p/${nextId}`)
    } catch (error) {
      const full =
        error instanceof DOMException && error.name === "QuotaExceededError"
      toast.error(
        full
          ? "浏览器存储空间不足，暂时无法创建短链接"
          : "保存项目失败，暂时无法创建短链接"
      )
      if (shouldStartTour) setTourOpen(true)
    }
  }

  const commit = (next: Pattern) => {
    if (!pattern || next.cells === pattern.cells) return
    setPast((items) => [...items.slice(-99), pattern])
    setFuture([])
    setPattern(next)
    setUpdatedAt(Date.now())
  }

  const undo = () => {
    const previous = past.at(-1)
    if (!previous || !pattern) return
    setPast((items) => items.slice(0, -1))
    setFuture((items) => [pattern, ...items].slice(0, 100))
    setPattern(previous)
    setUpdatedAt(Date.now())
  }

  const redo = () => {
    const next = future[0]
    if (!next || !pattern) return
    setFuture((items) => items.slice(1))
    setPast((items) => [...items.slice(-99), pattern])
    setPattern(next)
    setUpdatedAt(Date.now())
  }

  const reset = () => {
    setFile(null)
    setSourceName("")
    setName("未命名图纸")
    setSettings(defaults)
    setPattern(null)
    setPast([])
    setFuture([])
    activeProjectId.current = ""
    setProjectId("")
    setCreatedAt(0)
    setUpdatedAt(0)
    setZoom(100)
    setBooting(false)
    router.push("/p/new")
  }

  const current = React.useMemo<Project | null>(() => {
    if (!pattern || !projectId) return null
    return {
      version: 1,
      id: projectId,
      name,
      sourceName,
      source: file ?? undefined,
      width: pattern.width,
      height: pattern.height,
      cells: Array.from(pattern.cells),
      colors: pattern.colors,
      shape,
      settings,
      createdAt,
      updatedAt,
    }
  }, [
    pattern,
    projectId,
    name,
    sourceName,
    file,
    shape,
    settings,
    createdAt,
    updatedAt,
  ])

  React.useEffect(() => {
    if (!current) return
    const timer = window.setTimeout(() => {
      saveProject(current).catch((error) => {
        const full =
          error instanceof DOMException && error.name === "QuotaExceededError"
        toast.error(
          full
            ? "浏览器存储空间不足，请从“我的作品”导出项目备份"
            : "本地自动保存失败，请导出项目备份"
        )
      })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [current])

  const addColor = (color: BeadColor) => {
    if (!pattern) return
    const next = { ...pattern, colors: [...pattern.colors, color] }
    commit(next)
    setSelected(next.colors.length)
  }

  const activeHex = pattern?.colors[selected - 1]?.hex ?? "#D94E78"
  const rename = (next: string) => {
    setName(next)
    setUpdatedAt(Date.now())
  }

  const finishTour = React.useCallback(() => {
    try {
      window.localStorage.setItem(EDITOR_TOUR_COMPLETE, "1")
      window.sessionStorage.removeItem(EDITOR_TOUR_PENDING)
    } catch {
      // Closing the tour should never be blocked by unavailable storage.
    }
    setTourOpen(false)
  }, [])

  return (
    <div className="min-h-svh bg-background">
      <Nav
        ready={!!pattern}
        onNew={reset}
        onExport={() => setExportOpen(true)}
      />

      {!pattern && !loading && !booting && <Upload onFile={openFile} />}
      {!pattern && (loading || booting) && (
        <main className="flex min-h-svh items-center justify-center px-6 pt-24">
          <div className="flex w-full max-w-xs flex-col items-center gap-4 text-center">
            <p className="text-sm font-medium">
              {booting ? "正在打开本地作品" : "正在分析颜色和透明区域"}
            </p>
            <Progress value={booting ? 42 : 68} />
            <p className="text-xs text-muted-foreground">
              所有处理都在当前设备中完成
            </p>
          </div>
        </main>
      )}

      {pattern && (
        <main className="ui-enter flex h-svh min-h-0 flex-col pt-[86px]">
          <div className="grid min-h-0 flex-1 border-y lg:grid-cols-[288px_minmax(0,1fr)_300px]">
            <ScrollArea
              className="ui-panel-enter hidden min-h-0 border-r bg-background lg:block"
              data-tour="settings"
            >
              <aside>
                <Settings
                  value={settings}
                  name={name}
                  loading={loading}
                  canGenerate={!!file}
                  onChange={setSettings}
                  onNameChange={rename}
                  onGenerate={() => generate()}
                />
              </aside>
            </ScrollArea>

            <section className="flex min-h-0 min-w-0 flex-col bg-muted/30">
              <Toolbar
                tool={tool}
                shape={shape}
                zoom={zoom}
                color={activeHex}
                undoable={past.length > 0}
                redoable={future.length > 0}
                onTool={setTool}
                onShape={setShape}
                onZoom={setZoom}
                onUndo={undo}
                onRedo={redo}
              />
              <Canvas
                pattern={pattern}
                tool={tool}
                shape={shape}
                color={selected}
                zoom={zoom}
                highlight={highlight}
                onChange={commit}
                onZoom={setZoom}
                onPick={(color) => {
                  setSelected(color)
                  setTool("paint")
                }}
              />
            </section>

            <aside
              className="ui-panel-enter hidden min-h-0 border-l bg-background lg:flex"
              data-tour="palette"
            >
              <Palette
                pattern={pattern}
                selected={selected}
                onSelect={setSelected}
                onHighlight={setHighlight}
                onAdd={addColor}
                onReplace={(from, to) => commit(replace(pattern, from, to))}
              />
            </aside>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t bg-background p-2 lg:hidden">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setSettingsOpen(true)}
              data-tour="settings"
            >
              <HugeiconsIcon
                icon={Settings02Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              生成设置
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setPaletteOpen(true)}
              data-tour="palette"
            >
              <HugeiconsIcon
                icon={PaintBoardIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              颜色用量
            </Button>
          </div>

          <Drawer
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            showSwipeHandle
          >
            <DrawerContent className="h-[82dvh]">
              <DrawerHeader>
                <DrawerTitle>生成设置</DrawerTitle>
                <DrawerDescription>
                  调整后点击“应用生成设置”重新计算。
                </DrawerDescription>
              </DrawerHeader>
              <ScrollArea className="min-h-0 flex-1">
                <Settings
                  value={settings}
                  name={name}
                  loading={loading}
                  canGenerate={!!file}
                  onChange={setSettings}
                  onNameChange={rename}
                  onGenerate={async () => {
                    await generate()
                    setSettingsOpen(false)
                  }}
                />
              </ScrollArea>
            </DrawerContent>
          </Drawer>

          <Drawer
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            showSwipeHandle
          >
            <DrawerContent className="h-[82dvh]">
              <DrawerHeader>
                <DrawerTitle>颜色与用量</DrawerTitle>
                <DrawerDescription>
                  选择画笔色或突出显示图纸中的颜色。
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex min-h-0 flex-1">
                <Palette
                  pattern={pattern}
                  selected={selected}
                  onSelect={(color) => {
                    setSelected(color)
                    setPaletteOpen(false)
                  }}
                  onHighlight={setHighlight}
                  onAdd={addColor}
                  onReplace={(from, to) => commit(replace(pattern, from, to))}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </main>
      )}

      <CropDialog
        key={cropSource?.url ?? "closed"}
        open={!!cropSource}
        source={cropSource}
        size={{ width: settings.width, height: settings.height }}
        onOpen={(open) => {
          if (open || !cropSource) return
          URL.revokeObjectURL(cropSource.url)
          setCropSource(null)
        }}
        onApply={applyCrop}
      />
      <ExportDialog
        open={exportOpen}
        pattern={pattern}
        name={name}
        shape={shape}
        onOpen={setExportOpen}
      />
      {tourOpen && <EditorTour onFinish={finishTour} />}
    </div>
  )
}

function firstColor(pattern: Pattern) {
  for (const value of pattern.cells) if (value) return value
  return 1
}
