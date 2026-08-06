"use client"

import * as React from "react"
import {
  ArrowRight01Icon,
  FileExportIcon,
  GridIcon,
  Image01Icon,
  Loading03Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import Cropper from "react-easy-crop"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Canvas } from "@/features/editor/canvas"
import { Palette } from "@/features/editor/palette"
import { Toolbar } from "@/features/editor/toolbar"
import { getPalette } from "@/data/palettes"
import { svgReport } from "@/lib/export"
import { readImage } from "@/lib/image"
import { convert } from "@/lib/pattern/convert"
import { total } from "@/lib/pattern/edit"
import {
  defaults,
  type ExportOpts,
  type Pattern,
  type Settings,
} from "@/types/pattern"

const DEMO_IMAGE = "/pixoras-cat-demo.jpg"

const DEMO_SETTINGS: Settings = {
  ...defaults,
  width: 58,
  height: 59,
  maxColors: 10,
  palette: "perler",
}

const DEMO_EXPORT: ExportOpts = {
  mode: "report",
  scale: 2,
  shape: "circle",
  cellSize: 18,
  grid: true,
  coords: true,
  boards: true,
  labels: false,
  legend: true,
  transparent: false,
  author: false,
  authorName: "",
}

export function ProcessStrip() {
  const sectionRef = React.useRef<HTMLElement>(null)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const progressRef = React.useRef<HTMLSpanElement>(null)
  const currentStageRef = React.useRef<HTMLSpanElement>(null)
  const { pattern, error } = useDemoPattern()

  React.useEffect(() => {
    const section = sectionRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    const progressLine = progressRef.current
    const currentStage = currentStageRef.current

    if (!section || !viewport || !track || !progressLine || !currentStage) {
      return
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let horizontalTravel = 0
    let animationFrame = 0
    let stageNumber = 1

    const render = () => {
      animationFrame = 0

      if (reducedMotion.matches) {
        track.style.removeProperty("transform")
        progressLine.style.transform = "scaleX(1)"
        currentStage.textContent = "01—04"
        return
      }

      const rect = section.getBoundingClientRect()
      const scrollDistance = Math.max(
        section.offsetHeight - window.innerHeight,
        1
      )
      const progress = Math.min(1, Math.max(0, -rect.top / scrollDistance))
      const nextStage = Math.min(4, Math.round(progress * 3) + 1)

      track.style.transform = `translate3d(${-horizontalTravel * progress}px, 0, 0)`
      progressLine.style.transform = `scaleX(${progress})`

      if (nextStage !== stageNumber) {
        stageNumber = nextStage
        currentStage.textContent = `${String(stageNumber).padStart(2, "0")} / 04`
      }
    }

    const scheduleRender = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(render)
      }
    }

    const measure = () => {
      if (reducedMotion.matches) {
        section.style.removeProperty("height")
        track.style.removeProperty("padding-inline")
        horizontalTravel = 0
        scheduleRender()
        return
      }

      const firstStage = track.querySelector<HTMLElement>("article")
      const stageWidth = firstStage?.offsetWidth ?? 0
      const edgePadding = Math.max(16, (viewport.clientWidth - stageWidth) / 2)

      track.style.paddingInline = `${edgePadding}px`
      horizontalTravel = Math.max(0, track.scrollWidth - viewport.clientWidth)
      section.style.height = `${window.innerHeight + horizontalTravel}px`
      scheduleRender()
    }

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(viewport)
    resizeObserver.observe(track)
    reducedMotion.addEventListener("change", measure)
    window.addEventListener("scroll", scheduleRender, { passive: true })
    window.addEventListener("resize", measure)
    measure()

    return () => {
      resizeObserver.disconnect()
      reducedMotion.removeEventListener("change", measure)
      window.removeEventListener("scroll", scheduleRender)
      window.removeEventListener("resize", measure)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="process-scroll-section relative border-b"
      aria-labelledby="process-title"
    >
      <div className="process-scroll-sticky sticky top-0 flex min-h-svh flex-col justify-center overflow-hidden pt-24 pb-8">
        <div className="process-scroll-intro mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col items-start gap-3">
            <span className="font-mono text-sm text-primary">
              PIXORAS / REAL WORKFLOW
            </span>
            <h2
              id="process-title"
              className="process-scroll-heading font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
            >
              向下滚动，看这张猫咪图变成拼豆图纸。
            </h2>
          </div>
          <p className="process-scroll-copy max-w-md text-base leading-7 text-muted-foreground">
            同一张原图、同一套创作界面，也使用 Pixoras 当前的 Perler
            色卡算法生成。
          </p>
        </div>

        <div
          ref={viewportRef}
          className="process-scroll-viewport mt-8 overflow-hidden border-y bg-muted/20"
        >
          <div className="mx-auto flex h-12 max-w-7xl items-center justify-between border-x px-4 text-xs text-muted-foreground sm:px-6">
            <span className="font-mono tracking-[0.16em]">
              LOCAL PROCESSING LINE
            </span>
            <span className="flex items-center gap-2">
              <i className="size-2 rounded-full bg-primary" aria-hidden />
              <span className="process-wheel-hint">向下滚动</span>
              <span className="process-drag-hint hidden">横向滑动</span>
              <b
                ref={currentStageRef}
                className="font-mono font-medium text-foreground"
              >
                01 / 04
              </b>
            </span>
          </div>

          <div
            ref={trackRef}
            className="process-scroll-track flex w-max items-center gap-4 py-6 sm:gap-6"
          >
            <ProcessStages pattern={pattern} error={error} />
          </div>
        </div>

        <div className="process-scroll-footer mx-auto mt-4 flex w-full max-w-7xl items-center gap-4 px-4 text-xs text-muted-foreground sm:px-8">
          <p className="shrink-0">真实图片与转换计算均保留在当前浏览器中。</p>
          <span
            className="process-scroll-progress h-px flex-1 overflow-hidden bg-border"
            aria-hidden
          >
            <span
              ref={progressRef}
              className="block size-full origin-left bg-primary"
            />
          </span>
          <span className="hidden font-mono sm:inline">01—04</span>
        </div>
      </div>
    </section>
  )
}

function ProcessStages({
  pattern,
  error,
}: {
  pattern: Pattern | null
  error: string | null
}) {
  const beadCount = pattern ? total(pattern) : 0

  return (
    <>
      <StageFrame
        number="01"
        eyebrow="原图"
        title="导入演示图片"
        meta="cat-demo.jpg · 1178 × 1162"
      >
        <SourceFileDemo />
      </StageFrame>
      <Connector label="裁剪" />
      <StageFrame
        number="02"
        eyebrow="裁剪"
        title="在裁剪界面确定范围"
        meta="58:59 · 58 × 59 格"
      >
        <CropInterfaceDemo />
      </StageFrame>
      <Connector label="生成" />
      <StageFrame
        number="03"
        eyebrow="编辑"
        title="在编辑器检查豆色"
        meta={
          pattern ? `${beadCount} 颗 · Perler 色卡` : "正在匹配 Perler 色卡"
        }
      >
        <EditorInterfaceDemo pattern={pattern} error={error} />
      </StageFrame>
      <Connector label="导出" />
      <StageFrame
        number="04"
        eyebrow="导出"
        title="预览并导出图纸"
        meta="PNG · SVG · CSV 用量表"
      >
        <ExportInterfaceDemo pattern={pattern} error={error} />
      </StageFrame>
    </>
  )
}

function StageFrame({
  number,
  eyebrow,
  title,
  meta,
  children,
}: {
  number: string
  eyebrow: string
  title: string
  meta: string
  children: React.ReactNode
}) {
  return (
    <article className="w-[clamp(22rem,58vw,52rem)] shrink-0 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-mono text-xs text-primary">{number}</span>
        <span className="text-xs text-muted-foreground">{eyebrow}</span>
      </div>
      <div className="process-stage-surface pointer-events-none h-[clamp(22rem,50vh,30rem)] overflow-hidden bg-background">
        {children}
      </div>
      <div className="process-stage-footer flex flex-col gap-1 border-t px-4 py-4">
        <h3 className="text-base font-medium">{title}</h3>
        <p className="font-mono text-xs text-muted-foreground">{meta}</p>
      </div>
    </article>
  )
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2 text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="flex size-9 items-center justify-center rounded-full border bg-background">
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="size-4"
        />
      </span>
    </div>
  )
}

function SourceFileDemo() {
  return (
    <div className="grid size-full grid-cols-[minmax(0,1fr)_9.5rem] sm:grid-cols-[minmax(0,1fr)_12rem]">
      <section className="flex min-w-0 flex-col bg-muted/25">
        <div className="flex h-10 items-center justify-between border-b px-3 text-[10px] text-muted-foreground">
          <span>原图预览</span>
          <span className="font-mono">1178 × 1162</span>
        </div>
        <div className="relative m-3 min-h-0 flex-1 overflow-hidden rounded-md bg-neutral-950">
          <Image
            src={DEMO_IMAGE}
            alt="猫咪插画演示原图"
            fill
            sizes="(max-width: 640px) 14rem, 32rem"
            className="object-contain"
          />
        </div>
      </section>
      <aside className="flex min-w-0 flex-col border-l p-3 sm:p-4">
        <span className="font-mono text-[10px] text-primary">JPEG</span>
        <h4 className="mt-2 truncate text-sm font-medium">cat-demo.jpg</h4>
        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
          424.7 KB
          <br />
          本地文件
        </p>
        <Button size="sm" className="mt-auto">
          <HugeiconsIcon
            icon={Image01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          进入裁剪
        </Button>
      </aside>
    </div>
  )
}

function CropInterfaceDemo() {
  return (
    <div className="grid size-full grid-cols-[minmax(0,1fr)_10.5rem] sm:grid-cols-[minmax(0,1fr)_13rem]">
      <section className="flex min-w-0 flex-col bg-muted/25 p-3">
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="font-medium">实时预览</span>
          <span className="rounded-sm border bg-background px-1.5 py-0.5 font-mono">
            100%
          </span>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/40">
          <Cropper
            image={DEMO_IMAGE}
            crop={{ x: 0, y: 0 }}
            zoom={1}
            rotation={0}
            aspect={58 / 59}
            objectFit="contain"
            showGrid
            onCropChange={() => undefined}
            onZoomChange={() => undefined}
          />
        </div>
      </section>

      <aside className="flex min-w-0 flex-col gap-3 overflow-hidden border-l bg-background p-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium">预览方式</span>
          <ToggleGroup
            value={["photo"]}
            variant="outline"
            spacing={1}
            size="sm"
            className="grid grid-cols-2"
          >
            <ToggleGroupItem value="photo">原图</ToggleGroupItem>
            <ToggleGroupItem value="pixel">像素</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="font-medium">图纸宽度</span>
            <span className="font-mono">58 × 59</span>
          </div>
          <Slider defaultValue={[58]} min={10} max={200} step={1} />
        </div>
        <div className="flex items-center justify-between rounded-md border px-2 py-1.5 text-[10px]">
          <span>裁剪比例</span>
          <span className="font-mono text-primary">58:59</span>
        </div>
        <Button size="sm" className="mt-auto">
          <HugeiconsIcon
            icon={GridIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          按裁剪生成
        </Button>
      </aside>
    </div>
  )
}

function EditorInterfaceDemo({
  pattern,
  error,
}: {
  pattern: Pattern | null
  error: string | null
}) {
  if (!pattern) return <DemoLoading error={error} />

  const selected = firstColor(pattern)
  const selectedHex = pattern.colors[selected - 1]?.hex ?? "#F5F4EF"

  return (
    <div className="flex size-full flex-col">
      <Toolbar
        tool="paint"
        shape="circle"
        zoom={25}
        undoable={false}
        redoable={false}
        color={selectedHex}
        onTool={() => undefined}
        onShape={() => undefined}
        onZoom={() => undefined}
        onUndo={() => undefined}
        onRedo={() => undefined}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_11rem] sm:grid-cols-[minmax(0,1fr)_13rem]">
        <section className="flex min-h-0 min-w-0 bg-muted/25">
          <Canvas
            pattern={pattern}
            tool="paint"
            shape="circle"
            color={selected}
            zoom={25}
            highlight={null}
            onChange={() => undefined}
            onPick={() => undefined}
            onZoom={() => undefined}
          />
        </section>
        <aside className="flex min-h-0 border-l bg-background">
          <Palette
            pattern={pattern}
            selected={selected}
            onSelect={() => undefined}
            onHighlight={() => undefined}
            onAdd={() => undefined}
            onReplace={() => undefined}
          />
        </aside>
      </div>
    </div>
  )
}

function ExportInterfaceDemo({
  pattern,
  error,
}: {
  pattern: Pattern | null
  error: string | null
}) {
  const preview = React.useMemo(
    () => (pattern ? svgReport(pattern, DEMO_EXPORT, "猫咪拼豆图纸") : ""),
    [pattern]
  )

  if (!pattern) return <DemoLoading error={error} />

  return (
    <div className="grid size-full grid-cols-[10.5rem_minmax(0,1fr)] sm:grid-cols-[12.5rem_minmax(0,1fr)]">
      <aside className="flex min-w-0 flex-col border-r bg-background p-3">
        <div className="mb-3 flex items-center gap-2">
          <HugeiconsIcon icon={GridIcon} strokeWidth={2} className="size-3.5" />
          <span className="text-xs font-medium">图纸设置</span>
        </div>
        <ToggleGroup
          value={["report"]}
          variant="outline"
          spacing={1}
          size="sm"
          className="grid grid-cols-2"
        >
          <ToggleGroupItem value="report">完整</ToggleGroupItem>
          <ToggleGroupItem value="pattern">图案</ToggleGroupItem>
        </ToggleGroup>
        <div className="mt-3 flex flex-col gap-1.5 text-[10px]">
          {["显示细网格", "显示坐标", "材料清单"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between border-b py-1.5"
            >
              <span>{label}</span>
              <span className="font-mono text-primary">ON</span>
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-auto">
          <HugeiconsIcon
            icon={FileExportIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          导出 PNG
        </Button>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col bg-neutral-950 text-neutral-50">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-3">
          <span className="flex items-center gap-2 text-[10px] font-medium">
            <HugeiconsIcon
              icon={ViewIcon}
              strokeWidth={2}
              className="size-3.5"
            />
            导出预览
          </span>
          <span className="font-mono text-[10px] text-neutral-400">80%</span>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
          <div
            className="h-full max-w-full overflow-hidden bg-white shadow-sm [&_svg]:block [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      </section>
    </div>
  )
}

function DemoLoading({ error }: { error: string | null }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted/25 text-center">
      {!error && (
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="size-5 animate-spin text-primary"
        />
      )}
      <p className="text-xs font-medium">
        {error ? "演示图纸生成失败" : "正在使用 Pixoras 色卡生成…"}
      </p>
      {error && (
        <p className="max-w-72 text-[10px] leading-4 text-muted-foreground">
          {error}
        </p>
      )}
    </div>
  )
}

function useDemoPattern() {
  const [pattern, setPattern] = React.useState<Pattern | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()

    const generate = async () => {
      try {
        const response = await fetch(DEMO_IMAGE, { signal: controller.signal })
        if (!response.ok) throw new Error("无法读取演示图片")
        const blob = await response.blob()
        const file = new File([blob], "cat-demo.jpg", {
          type: blob.type || "image/jpeg",
        })
        const image = await readImage(file, DEMO_SETTINGS)
        const next = convert(
          image,
          getPalette(DEMO_SETTINGS.palette).colors,
          DEMO_SETTINGS
        )
        if (!controller.signal.aborted) setPattern(next)
      } catch (cause) {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : "无法生成演示图纸")
      }
    }

    void generate()
    return () => controller.abort()
  }, [])

  return { pattern, error }
}

function firstColor(pattern: Pattern) {
  for (const value of pattern.cells) {
    if (value) return value
  }
  return 1
}
