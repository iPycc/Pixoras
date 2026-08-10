"use client"

import * as React from "react"
import {
  Add01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  Delete02Icon,
  Download04Icon,
  FolderOpenIcon,
  Home01Icon,
  MoreHorizontalIcon,
  PaintBrush01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { toast } from "sonner"

import { Logo } from "@/components/app/logo"
import { ThemeButton } from "@/components/app/theme"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ProjectPreview } from "@/features/projects/preview"
import {
  deleteProject,
  listProjects,
  projectBlob,
  readProject,
  saveProject,
} from "@/lib/db"
import { save } from "@/lib/export"
import { shortId } from "@/lib/id"
import type { Project } from "@/types/project"

const dateTime = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function ProjectsPage() {
  const [items, setItems] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [failed, setFailed] = React.useState(false)
  const [removing, setRemoving] = React.useState<Project | null>(null)
  const input = React.useRef<HTMLInputElement>(null)

  const refresh = React.useCallback(async () => {
    try {
      const projects = await listProjects()
      setFailed(false)
      setItems(projects)
    } catch {
      setFailed(true)
      toast.error("无法读取本地作品")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => window.clearTimeout(initialLoad)
  }, [refresh])

  const duplicate = async (project: Project) => {
    try {
      await saveProject(projectCopy(project))
      await refresh()
      toast.success("已创建作品副本")
    } catch {
      toast.error("无法复制这个作品")
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <ProjectsHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-32 pb-16 sm:px-8 sm:pt-36">
        <section className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            <span className="text-sm font-medium text-primary">本地作品库</span>
            <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              我的作品
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              每张作品都以可继续编辑的拼豆图纸展示。作品只保存在当前浏览器，不会上传到服务器。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept="application/json,.pixoras.json"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                try {
                  const project = await readProject(file)
                  await saveProject(project)
                  await refresh()
                  toast.success("项目已导入")
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "导入失败"
                  )
                }
                event.target.value = ""
              }}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={() => input.current?.click()}
            >
              <HugeiconsIcon
                icon={Upload01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              导入项目
            </Button>
            <Button
              render={<Link href="/p/?id=new" />}
              nativeButton={false}
              size="lg"
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              新建图纸
            </Button>
          </div>
        </section>

        {loading ? (
          <p
            className="py-20 text-center text-sm text-muted-foreground"
            role="status"
          >
            正在读取当前设备上的作品…
          </p>
        ) : failed ? (
          <Empty className="min-h-96 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>暂时无法读取作品</EmptyTitle>
              <EmptyDescription>
                请确认浏览器允许此站点使用本地存储，然后重试。
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => void refresh()}>
                重新读取
              </Button>
            </EmptyContent>
          </Empty>
        ) : items.length === 0 ? (
          <Empty className="min-h-96 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>还没有保存的作品</EmptyTitle>
              <EmptyDescription>
                创建第一张拼豆图纸后，它会自动出现在这里。
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                render={<Link href="/p/?id=new" />}
                nativeButton={false}
                size="lg"
              >
                选择图片制作
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                />
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <section
            className="flex flex-col gap-5"
            aria-labelledby="saved-projects"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="saved-projects"
                className="text-lg font-semibold tracking-tight"
              >
                已保存的图纸
              </h2>
              <p className="text-sm text-muted-foreground">
                共 {items.length} 张
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDuplicate={() => void duplicate(project)}
                  onRemove={() => setRemoving(project)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <AlertDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent className="gap-5 p-6 data-[size=default]:max-w-[calc(100%_-_2rem)] data-[size=default]:sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              删除“{removing?.name}”？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              此操作会从当前浏览器永久移除该作品，且无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel size="lg">取消</AlertDialogCancel>
            <AlertDialogAction
              size="lg"
              variant="destructive"
              onClick={async () => {
                if (!removing) return
                try {
                  await deleteProject(removing.id)
                  setRemoving(null)
                  await refresh()
                  toast.success("作品已删除")
                } catch {
                  toast.error("无法删除这个作品")
                }
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function projectCopy(project: Project): Project {
  const now = Date.now()
  return {
    ...project,
    id: shortId(),
    name: `${project.name} 副本`,
    createdAt: now,
    updatedAt: now,
  }
}

function ProjectsHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4">
      <nav className="flex h-14 w-full max-w-7xl items-center justify-between rounded-full border bg-background/95 px-3 shadow-sm supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur-md">
        <Link
          href="/"
          aria-label="Pixoras 首页"
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="ghost"
            size="lg"
            className="rounded-full"
          >
            <HugeiconsIcon
              icon={Home01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            首页
          </Button>
          <Button
            render={<Link href="/p/?id=new" />}
            nativeButton={false}
            variant="ghost"
            size="lg"
            className="rounded-full"
          >
            <HugeiconsIcon
              icon={PaintBrush01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            创作台
          </Button>
          <Button variant="secondary" size="lg" className="rounded-full">
            <HugeiconsIcon
              icon={FolderOpenIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            我的作品
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="ghost"
            size="icon-lg"
            className="rounded-full sm:hidden"
            aria-label="返回首页"
          >
            <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
          </Button>
          <ThemeButton />
          <Button
            render={<Link href="/p/?id=new" />}
            nativeButton={false}
            size="lg"
            className="rounded-full sm:hidden"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            新建
          </Button>
        </div>
      </nav>
    </header>
  )
}

function ProjectCard({
  project,
  onDuplicate,
  onRemove,
}: {
  project: Project
  onDuplicate: () => void
  onRemove: () => void
}) {
  const beadCount = project.cells.reduce(
    (count, value) => count + (value ? 1 : 0),
    0
  )
  const usedColors =
    new Set(project.cells).size - (project.cells.includes(0) ? 1 : 0)

  return (
    <article className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/25">
      <Link
        href={`/p/?id=${encodeURIComponent(project.id)}`}
        className="block bg-muted/40 p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={`打开图纸：${project.name}`}
      >
        <div className="overflow-hidden rounded-md border bg-background transition-transform duration-200 group-hover:-translate-y-0.5">
          <ProjectPreview project={project} />
        </div>
      </Link>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">
              <Link
                href={`/p/?id=${encodeURIComponent(project.id)}`}
                className="outline-none hover:text-primary focus-visible:text-primary"
              >
                {project.name}
              </Link>
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              更新于 {dateTime.format(project.updatedAt)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`管理作品：${project.name}`}
                />
              }
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onDuplicate}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                  创建副本
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    save(
                      projectBlob(project),
                      `Pixoras-${project.name}.pixoras.json`
                    )
                  }
                >
                  <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
                  导出项目
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={onRemove}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  删除作品
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-end justify-between gap-4 border-t pt-3">
          <div className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            <span>
              {project.width} × {project.height} 格 · {beadCount} 颗豆
            </span>
            <span>{usedColors} 种颜色</span>
          </div>
          <Button
            render={<Link href={`/p/?id=${encodeURIComponent(project.id)}`} />}
            nativeButton={false}
            variant="outline"
          >
            打开图纸
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              data-icon="inline-end"
            />
          </Button>
        </div>
      </div>
    </article>
  )
}
