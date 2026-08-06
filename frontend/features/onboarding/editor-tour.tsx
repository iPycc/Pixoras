"use client"

import * as React from "react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Target = "canvas" | "toolbar" | "settings" | "palette" | "export"
type Placement = "left" | "right" | "bottom" | "corner"

interface Step {
  target: Target
  location: string
  title: string
  description: string
  placement: Placement
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
  right: number
  bottom: number
}

const steps: Step[] = [
  {
    target: "canvas",
    location: "中央 · 图纸画布",
    title: "在这里查看和修改图纸",
    description:
      "滚轮或双指可以缩放；选好工具后，直接在格子上绘制、擦除或取色。红线表示 29 格拼板的边界。",
    placement: "corner",
  },
  {
    target: "toolbar",
    location: "顶部 · 编辑工具",
    title: "切换画笔和画布操作",
    description:
      "这里可以选择画笔、橡皮、吸管、填充和移动工具，也能切换豆粒形状、撤销操作或调整缩放。",
    placement: "bottom",
  },
  {
    target: "settings",
    location: "左侧 · 生成设置",
    title: "控制图纸尺寸和转换效果",
    description:
      "在这里修改格数、拼豆品牌、颜色数量和图片方向。调整完成后，点击“应用生成设置”重新生成。",
    placement: "right",
  },
  {
    target: "palette",
    location: "右侧 · 颜色与用量",
    title: "查看色号和所需数量",
    description:
      "选择颜色可继续绘制，悬停可在图纸中突出同色格；底部还可以添加自定义色或全局替换颜色。",
    placement: "left",
  },
  {
    target: "export",
    location: "右上角 · 导出",
    title: "完成后导出制作文件",
    description:
      "从这里导出带坐标的 PNG、可缩放的 SVG，或用于备料统计的 CSV 用量表。",
    placement: "bottom",
  },
]

export function EditorTour({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = React.useState(0)
  const [rect, setRect] = React.useState<Rect | null>(null)
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 })
  const card = React.useRef<HTMLElement>(null)
  const step = steps[index]
  const last = index === steps.length - 1

  React.useLayoutEffect(() => {
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
      const target = [
        ...document.querySelectorAll<HTMLElement>(
          `[data-tour="${step.target}"]`
        ),
      ].find((element) => {
        const bounds = element.getBoundingClientRect()
        return bounds.width > 0 && bounds.height > 0
      })
      if (!target) {
        setRect(null)
        return
      }

      const bounds = target.getBoundingClientRect()
      const padding = step.target === "export" ? 6 : 8
      const left = Math.max(8, bounds.left - padding)
      const top = Math.max(8, bounds.top - padding)
      const right = Math.min(window.innerWidth - 8, bounds.right + padding)
      const bottom = Math.min(window.innerHeight - 8, bounds.bottom + padding)
      setRect({
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
      })
    }

    update()
    const frame = window.requestAnimationFrame(update)
    window.addEventListener("resize", update)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", update)
    }
  }, [step.target])

  React.useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    card.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onFinish()
        return
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        setIndex((value) => Math.min(steps.length - 1, value + 1))
        return
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setIndex((value) => Math.max(0, value - 1))
        return
      }
      if (event.key !== "Tab" || !card.current) return

      const focusable = [
        ...card.current.querySelectorAll<HTMLElement>("button:not([disabled])"),
      ]
      if (!focusable.length) return
      const first = focusable[0]
      const final = focusable.at(-1) ?? first
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        final.focus()
      } else if (!event.shiftKey && document.activeElement === final) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      previousFocus?.focus()
    }
  }, [onFinish])

  const cardStyle = getCardPosition(step.placement, rect, viewport)

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      aria-label="编辑器新手引导"
    >
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg border-2 border-primary shadow-[0_0_0_9999px_rgb(0_0_0/0.58)] transition-[left,top,width,height] duration-300 motion-reduce:transition-none"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-foreground/60" aria-hidden="true" />
      )}

      <section
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-tour-title"
        aria-describedby="editor-tour-description"
        tabIndex={-1}
        className="absolute flex max-h-[calc(100dvh-32px)] w-[min(360px,calc(100vw-32px))] flex-col gap-4 overflow-y-auto rounded-xl border bg-popover p-5 text-popover-foreground shadow-xl outline-none"
        style={cardStyle}
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{step.location}</Badge>
          <Button variant="ghost" size="sm" onClick={onFinish}>
            跳过
          </Button>
        </div>

        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="font-mono text-xs text-muted-foreground">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(steps.length).padStart(2, "0")}
          </p>
          <h2
            id="editor-tour-title"
            className="text-lg leading-7 font-semibold"
          >
            {step.title}
          </h2>
          <p
            id="editor-tour-description"
            className="text-sm leading-6 text-muted-foreground"
          >
            {step.description}
          </p>
        </div>

        <div className="flex gap-1" aria-hidden="true">
          {steps.map((item, itemIndex) => (
            <span
              key={item.target}
              className={cn(
                "h-1 flex-1 rounded-full",
                itemIndex <= index ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            上一步
          </Button>
          <Button
            onClick={() => (last ? onFinish() : setIndex((value) => value + 1))}
          >
            {last ? (
              <HugeiconsIcon
                icon={Tick01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            ) : null}
            {last ? "开始制作" : "下一步"}
            {!last ? (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-end"
              />
            ) : null}
          </Button>
        </div>
      </section>
    </div>
  )
}

function getCardPosition(
  placement: Placement,
  rect: Rect | null,
  viewport: { width: number; height: number }
): React.CSSProperties {
  const width = Math.min(360, Math.max(280, viewport.width - 32))
  const estimatedHeight = 280
  const edge = 16
  const gap = 16
  const maxLeft = Math.max(edge, viewport.width - width - edge)
  const maxTop = Math.max(edge, viewport.height - estimatedHeight - edge)
  const clampLeft = (value: number) => Math.max(edge, Math.min(maxLeft, value))
  const clampTop = (value: number) => Math.max(edge, Math.min(maxTop, value))

  if (rect && viewport.width < 1024 && rect.top > viewport.height * 0.65) {
    return {
      left:
        viewport.width < 768 ? edge : clampLeft(viewport.width / 2 - width / 2),
      top: clampTop(96),
    }
  }
  if (!rect || viewport.width < 768) return { left: edge, bottom: edge }
  if (placement === "left") {
    return {
      left: clampLeft(rect.left - width - gap),
      top: clampTop(rect.top + 24),
    }
  }
  if (placement === "right") {
    return { left: clampLeft(rect.right + gap), top: clampTop(rect.top + 24) }
  }
  if (placement === "corner") {
    return { right: edge, bottom: edge }
  }
  return {
    left: clampLeft(rect.left + rect.width / 2 - width / 2),
    top: clampTop(rect.bottom + gap),
  }
}
