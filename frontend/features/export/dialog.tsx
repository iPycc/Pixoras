"use client"

import * as React from "react"
import {
  FileExportIcon,
  Loading03Icon,
  Settings02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { renderPng, saveCsv, savePng, saveSvg } from "@/lib/export"
import type { BeadShape, ExportOpts, Pattern } from "@/types/pattern"

function initial(shape: BeadShape): ExportOpts {
  return {
    mode: "report",
    scale: 2,
    shape,
    cellSize: 24,
    grid: true,
    coords: true,
    boards: true,
    labels: true,
    legend: true,
    transparent: false,
    author: false,
    authorName: "",
  }
}

interface Props {
  open: boolean
  pattern: Pattern | null
  name: string
  shape: BeadShape
  onOpen: (open: boolean) => void
}

export function ExportDialog({ open, pattern, name, shape, onOpen }: Props) {
  const [opts, setOpts] = React.useState(() => initial(shape))
  const [busy, setBusy] = React.useState<string | null>(null)
  const [previewZoom, setPreviewZoom] = React.useState(80)
  const [preview, setPreview] = React.useState<{
    url: string
    width: number
    height: number
  } | null>(null)
  const [previewBusy, setPreviewBusy] = React.useState(false)
  const [previewError, setPreviewError] = React.useState("")
  const previewUrl = React.useRef("")
  const previewRequest = React.useRef(0)
  const previewCache = React.useRef<{
    pattern: Pattern
    name: string
    options: ExportOpts
  } | null>(null)
  const patch = (next: Partial<ExportOpts>) =>
    setOpts((value) => ({ ...value, ...next }))
  const zoomPreview = (next: number) =>
    setPreviewZoom(Math.min(150, Math.max(25, next)))
  const previewOptions = React.useMemo<ExportOpts>(
    () => ({
      mode: opts.mode,
      scale: 2,
      shape: opts.shape,
      cellSize: opts.cellSize,
      grid: opts.grid,
      coords: opts.coords,
      boards: opts.boards,
      labels: opts.labels,
      legend: opts.legend,
      transparent: opts.transparent,
      author: opts.author,
      authorName: opts.authorName,
    }),
    [
      opts.mode,
      opts.shape,
      opts.cellSize,
      opts.grid,
      opts.coords,
      opts.boards,
      opts.labels,
      opts.legend,
      opts.transparent,
      opts.author,
      opts.authorName,
    ]
  )

  React.useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    }
  }, [])

  React.useEffect(() => {
    if (!open || !pattern) {
      previewRequest.current += 1
      return
    }
    const cached = previewCache.current
    if (
      cached?.pattern === pattern &&
      cached.name === name &&
      cached.options === previewOptions &&
      previewUrl.current
    ) {
      return
    }

    const request = ++previewRequest.current
    let cancelled = false
    setPreviewBusy(true)
    setPreviewError("")
    const timer = window.setTimeout(async () => {
      try {
        const maxSide = window.matchMedia("(max-width: 767px)").matches
          ? 960
          : 1600
        const rendered = await renderPng(pattern, previewOptions, name, {
          scale: 1,
          maxSide,
        })
        const url = URL.createObjectURL(rendered.blob)
        const image = new Image()
        image.src = url
        await image.decode()
        if (cancelled || request !== previewRequest.current) {
          URL.revokeObjectURL(url)
          return
        }

        const previous = previewUrl.current
        previewUrl.current = url
        previewCache.current = { pattern, name, options: previewOptions }
        setPreview({ url, width: rendered.width, height: rendered.height })
        if (previous) window.setTimeout(() => URL.revokeObjectURL(previous), 0)
      } catch (error) {
        if (cancelled || request !== previewRequest.current) return
        setPreviewError(
          error instanceof Error ? error.message : "PNG 预览生成失败"
        )
      } finally {
        if (!cancelled && request === previewRequest.current)
          setPreviewBusy(false)
      }
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [name, open, pattern, previewOptions])

  const handlePreviewWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const viewport = event.currentTarget
    const nextZoom = Math.min(
      150,
      Math.max(25, previewZoom + (event.deltaY < 0 ? 10 : -10))
    )
    if (nextZoom === previewZoom) return

    const bounds = viewport.getBoundingClientRect()
    const pointerX = event.clientX - bounds.left
    const pointerY = event.clientY - bounds.top
    const anchorX = viewport.scrollLeft + pointerX
    const anchorY = viewport.scrollTop + pointerY
    const ratio = nextZoom / previewZoom

    setPreviewZoom(nextZoom)
    requestAnimationFrame(() => {
      viewport.scrollLeft = anchorX * ratio - pointerX
      viewport.scrollTop = anchorY * ratio - pointerY
    })
  }

  const run = async (format: "png" | "svg" | "csv") => {
    if (!pattern) return
    setBusy(format)
    try {
      if (format === "png") await savePng(pattern, opts, name)
      if (format === "svg") await saveSvg(pattern, opts, name)
      if (format === "csv") await saveCsv(pattern, name)
      toast.success(`${format.toUpperCase()} 已生成`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导出失败")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setPreviewBusy(false)
        onOpen(next)
      }}
    >
      <DialogContent
        showCloseButton
        className="grid h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-2rem)] xl:max-w-7xl"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-lg">导出图纸</DialogTitle>
          <DialogDescription>
            先确认颜色编号、网格和材料清单，再导出最终文件。
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(240px,1fr)] md:grid-cols-[320px_minmax(0,1fr)] md:grid-rows-1">
          <ScrollArea className="min-h-0 border-b bg-background md:border-r md:border-b-0">
            <div className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <HugeiconsIcon
                  icon={Settings02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <h3 className="text-sm font-medium">图纸设置</h3>
              </div>
              <FieldGroup>
                <Field>
                  <FieldTitle>输出内容</FieldTitle>
                  <ToggleGroup
                    value={[opts.mode]}
                    onValueChange={(items) =>
                      items[0] &&
                      patch({ mode: items[0] as ExportOpts["mode"] })
                    }
                    variant="outline"
                    spacing={1}
                    className="grid w-full grid-cols-2"
                  >
                    <ToggleGroupItem value="report">完整图纸</ToggleGroupItem>
                    <ToggleGroupItem value="pattern">纯图案</ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <Field>
                  <div className="flex items-center justify-between gap-3">
                    <FieldTitle>格子大小</FieldTitle>
                    <span className="font-mono text-xs">{opts.cellSize}px</span>
                  </div>
                  <Slider
                    min={12}
                    max={32}
                    step={1}
                    value={[opts.cellSize]}
                    onValueChange={(next) =>
                      patch({ cellSize: Array.isArray(next) ? next[0] : next })
                    }
                  />
                  <FieldDescription>
                    大图会自动限制总尺寸，避免浏览器内存溢出。
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldTitle>格子形状</FieldTitle>
                  <ToggleGroup
                    value={[opts.shape]}
                    onValueChange={(items) =>
                      items[0] && patch({ shape: items[0] as BeadShape })
                    }
                    variant="outline"
                    spacing={1}
                    className="grid w-full grid-cols-2"
                  >
                    <ToggleGroupItem value="circle">圆形豆粒</ToggleGroupItem>
                    <ToggleGroupItem value="square">方形色格</ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <Separator />
                <ToggleField
                  title="显示细网格"
                  description="每个豆格的边界线"
                  checked={opts.grid}
                  onChange={(grid) => patch({ grid })}
                />
                <ToggleField
                  title="显示坐标"
                  description="图案四周的行列编号"
                  checked={opts.coords}
                  onChange={(coords) => patch({ coords })}
                />
                <ToggleField
                  title="拼板分界"
                  description="每 29 格加粗一条分界线"
                  checked={opts.boards}
                  onChange={(boards) => patch({ boards })}
                />
                <ToggleField
                  title="显示颜色编号"
                  description="在非空豆格内写入色号"
                  checked={opts.labels}
                  onChange={(labels) => patch({ labels })}
                />
                <ToggleField
                  title="材料清单"
                  description="包含颜色、数量和占比"
                  checked={opts.legend}
                  onChange={(legend) => patch({ legend })}
                />

                {opts.mode === "pattern" && (
                  <ToggleField
                    title="透明背景"
                    description="空位保持透明"
                    checked={opts.transparent}
                    onChange={(transparent) => patch({ transparent })}
                  />
                )}

                <Separator />
                <Field>
                  <FieldTitle>页脚署名</FieldTitle>
                  <FieldDescription>
                    默认显示 Designed by Pixoras，可选择添加作者名称。
                  </FieldDescription>
                </Field>
                <ToggleField
                  title="作者署名"
                  description="在图纸底部显示作者名称"
                  checked={opts.author}
                  onChange={(author) => patch({ author })}
                />
                {opts.author && (
                  <Field>
                    <FieldLabel htmlFor="export-author">作者名称</FieldLabel>
                    <Input
                      id="export-author"
                      value={opts.authorName}
                      maxLength={20}
                      placeholder="匿名作者"
                      onChange={(event) =>
                        patch({ authorName: event.target.value })
                      }
                    />
                  </Field>
                )}

                <Separator />
                <Field>
                  <FieldTitle>PNG 清晰度</FieldTitle>
                  <ToggleGroup
                    value={[String(opts.scale)]}
                    onValueChange={(items) =>
                      items[0] && patch({ scale: Number(items[0]) as 2 | 4 })
                    }
                    variant="outline"
                    spacing={1}
                    className="grid w-full grid-cols-2"
                  >
                    <ToggleGroupItem value="2">2×</ToggleGroupItem>
                    <ToggleGroupItem value="4">4×</ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              </FieldGroup>
            </div>
          </ScrollArea>

          <section className="flex min-h-[240px] min-w-0 flex-col bg-neutral-950 text-neutral-50 md:min-h-0">
            <div className="flex min-h-14 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={ViewIcon}
                  strokeWidth={2}
                  className="size-4"
                />
                <h3 className="text-sm font-medium">导出预览</h3>
                {previewBusy && (
                  <span className="flex items-center gap-1 text-xs text-neutral-400">
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      strokeWidth={2}
                      className="size-3 animate-spin"
                    />
                    更新中
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-neutral-400 lg:inline">
                  滚轮缩放
                </span>
                <div className="flex items-center rounded-lg border border-white/15 bg-white/5 p-0.5 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 bg-white/8 text-white hover:bg-white/15 hover:text-white disabled:bg-transparent disabled:text-neutral-600"
                    disabled={previewZoom <= 25}
                    onClick={() => zoomPreview(previewZoom - 10)}
                    aria-label="缩小预览"
                  >
                    <span
                      aria-hidden
                      className="text-lg leading-none font-semibold"
                    >
                      −
                    </span>
                  </Button>
                  <span className="min-w-14 text-center font-mono text-xs font-medium text-white">
                    {previewZoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 bg-white/8 text-white hover:bg-white/15 hover:text-white disabled:bg-transparent disabled:text-neutral-600"
                    disabled={previewZoom >= 150}
                    onClick={() => zoomPreview(previewZoom + 10)}
                    aria-label="放大预览"
                  >
                    <span
                      aria-hidden
                      className="text-lg leading-none font-semibold"
                    >
                      +
                    </span>
                  </Button>
                </div>
              </div>
            </div>
            <div
              className="min-h-0 flex-1 overflow-auto overscroll-contain p-5"
              onWheel={handlePreviewWheel}
              aria-label="导出图纸预览，可使用鼠标滚轮缩放"
            >
              {preview && (
                <div className="min-h-full min-w-full">
                  {/* Blob URLs are already optimized preview rasters and cannot use Next's loader. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={`${name} PNG 导出预览`}
                    className="mx-auto block h-auto shrink-0 shadow-xl"
                    style={{
                      width: `${previewZoom}%`,
                      aspectRatio: `${preview.width} / ${preview.height}`,
                    }}
                  />
                </div>
              )}
              {!preview && previewBusy && (
                <div className="flex min-h-full items-center justify-center text-sm text-neutral-400">
                  正在生成轻量 PNG 预览…
                </div>
              )}
              {previewError && !preview && !previewBusy && (
                <div className="flex min-h-full items-center justify-center px-6 text-center text-sm text-red-300">
                  {previewError}
                </div>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="border-t bg-background px-6 py-4">
          <Button
            variant="outline"
            disabled={!pattern || !!busy}
            onClick={() => run("csv")}
          >
            CSV 用量表
          </Button>
          <Button
            variant="outline"
            disabled={!pattern || !!busy}
            onClick={() => run("svg")}
          >
            SVG
          </Button>
          <Button disabled={!pattern || !!busy} onClick={() => run("png")}>
            {busy === "png" ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <HugeiconsIcon
                icon={FileExportIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            )}
            导出 PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ToggleField({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Field orientation="horizontal">
      <div className="min-w-0 flex-1">
        <FieldTitle>{title}</FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Field>
  )
}
