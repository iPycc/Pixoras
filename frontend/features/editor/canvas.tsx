"use client"

import * as React from "react"

import { fill, paint, total } from "@/lib/pattern/edit"
import type { BeadShape, Pattern, Tool } from "@/types/pattern"

interface Props {
  pattern: Pattern
  tool: Tool
  shape: BeadShape
  color: number
  zoom: number
  highlight: number | null
  onChange: (pattern: Pattern) => void
  onPick: (color: number) => void
  onZoom: (zoom: number) => void
}

export function Canvas({
  pattern,
  tool,
  shape,
  color,
  zoom,
  highlight,
  onChange,
  onPick,
  onZoom,
}: Props) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const viewport = React.useRef<HTMLDivElement>(null)
  const drawing = React.useRef(false)
  const last = React.useRef(-1)
  const pointers = React.useRef(new Map<number, { x: number; y: number }>())
  const pan = React.useRef<{
    x: number
    y: number
    left: number
    top: number
  } | null>(null)
  const pinch = React.useRef<{ distance: number; zoom: number } | null>(null)
  const [hover, setHover] = React.useState<{
    left: number
    top: number
    x: number
    y: number
    value: number
  } | null>(null)
  const cell = Math.max(7, Math.min(64, Math.round(18 * (zoom / 100))))
  const pad = 30

  React.useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    // The work board is intentionally theme-independent so bead HEX colors have
    // the same visual reference in light and dark mode.
    const board = "#FBFAF8"
    const hole = "#E8E5E1"
    canvas.width = pattern.width * cell + pad * 2
    canvas.height = pattern.height * cell + pad * 2
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = board
    context.fillRect(pad, pad, pattern.width * cell, pattern.height * cell)

    for (let y = 0; y < pattern.height; y++) {
      for (let x = 0; x < pattern.width; x++) {
        const value = pattern.cells[y * pattern.width + x]
        if (!value) continue
        const bead = pattern.colors[value - 1]
        const centerX = pad + x * cell + cell / 2
        const centerY = pad + y * cell + cell / 2
        context.globalAlpha = highlight && highlight !== value ? 0.13 : 1
        context.fillStyle = bead.hex
        if (shape === "circle") {
          context.beginPath()
          context.arc(centerX, centerY, cell * 0.4, 0, Math.PI * 2)
          context.fill()
          if (cell >= 12) {
            context.beginPath()
            context.arc(
              centerX,
              centerY,
              Math.max(1.2, cell * 0.095),
              0,
              Math.PI * 2
            )
            context.fillStyle = hole
            context.fill()
          }
        } else {
          context.fillRect(
            pad + x * cell + 0.75,
            pad + y * cell + 0.75,
            cell - 1.5,
            cell - 1.5
          )
        }
      }
    }
    context.globalAlpha = 1

    context.lineWidth = 0.75
    context.strokeStyle = "rgba(36,31,29,.12)"
    context.beginPath()
    for (let x = 0; x <= pattern.width; x++) {
      const px = pad + x * cell
      context.moveTo(px, pad)
      context.lineTo(px, pad + pattern.height * cell)
    }
    for (let y = 0; y <= pattern.height; y++) {
      const py = pad + y * cell
      context.moveTo(pad, py)
      context.lineTo(pad + pattern.width * cell, py)
    }
    context.stroke()

    context.lineWidth = 2
    context.strokeStyle = "#C93E6A"
    context.beginPath()
    for (let x = 29; x < pattern.width; x += 29) {
      const px = pad + x * cell
      context.moveTo(px, pad)
      context.lineTo(px, pad + pattern.height * cell)
    }
    for (let y = 29; y < pattern.height; y += 29) {
      const py = pad + y * cell
      context.moveTo(pad, py)
      context.lineTo(pad + pattern.width * cell, py)
    }
    context.stroke()

    context.fillStyle = "#7A706C"
    context.font = "10px 'Noto Sans SC Variable', 'Noto Sans SC', sans-serif"
    context.textAlign = "center"
    for (let x = 4; x < pattern.width; x += 5) {
      context.fillText(String(x + 1), pad + (x + 0.5) * cell, 19)
    }
    context.textAlign = "right"
    for (let y = 4; y < pattern.height; y += 5) {
      context.fillText(String(y + 1), 23, pad + (y + 0.7) * cell)
    }
  }, [pattern, cell, highlight, shape])

  const indexAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left - pad) / cell)
    const y = Math.floor((event.clientY - rect.top - pad) / cell)
    if (x < 0 || x >= pattern.width || y < 0 || y >= pattern.height) return -1
    return y * pattern.width + x
  }

  const apply = (
    event: React.PointerEvent<HTMLCanvasElement>,
    start = false
  ) => {
    const index = indexAt(event)
    if (index < 0 || (!start && index === last.current)) return
    last.current = index
    if (tool === "paint") onChange(paint(pattern, index, color))
    if (tool === "erase") onChange(paint(pattern, index, 0))
    if (tool === "pick") {
      const value = pattern.cells[index]
      if (value) onPick(value)
      drawing.current = false
    }
    if (tool === "fill") {
      onChange(fill(pattern, index, color))
      drawing.current = false
    }
  }

  const updateHover = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const index = indexAt(event)
    const value = index >= 0 ? pattern.cells[index] : 0
    if (!value) {
      setHover(null)
      return
    }
    setHover({
      left: event.clientX + 14,
      top: event.clientY + 14,
      x: index % pattern.width,
      y: Math.floor(index / pattern.width),
      value,
    })
  }

  return (
    <div
      ref={viewport}
      className="canvas-scroll relative flex min-h-0 flex-1 overflow-auto overscroll-contain"
      data-tour="canvas"
    >
      <canvas
        ref={ref}
        className="m-auto touch-none select-none"
        style={{ cursor: tool === "pan" ? "grab" : "crosshair" }}
        aria-label={`${pattern.width} × ${pattern.height} 拼豆图纸，共 ${total(pattern)} 颗豆`}
        onWheel={(event) => {
          event.preventDefault()
          onZoom(clampZoom(zoom + (event.deltaY < 0 ? 25 : -25)))
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
          })
          if (pointers.current.size === 2) {
            pinch.current = {
              distance: pointerDistance(pointers.current),
              zoom,
            }
            drawing.current = false
            return
          }
          if (tool === "pan") {
            const node = viewport.current
            if (node) {
              pan.current = {
                x: event.clientX,
                y: event.clientY,
                left: node.scrollLeft,
                top: node.scrollTop,
              }
            }
            return
          }
          drawing.current = true
          apply(event, true)
        }}
        onPointerMove={(event) => {
          updateHover(event)
          if (pointers.current.has(event.pointerId)) {
            pointers.current.set(event.pointerId, {
              x: event.clientX,
              y: event.clientY,
            })
          }
          if (pointers.current.size >= 2 && pinch.current) {
            const scale =
              pointerDistance(pointers.current) / pinch.current.distance
            onZoom(clampZoom(Math.round((pinch.current.zoom * scale) / 5) * 5))
            return
          }
          if (tool === "pan" && pan.current && viewport.current) {
            viewport.current.scrollLeft =
              pan.current.left - (event.clientX - pan.current.x)
            viewport.current.scrollTop =
              pan.current.top - (event.clientY - pan.current.y)
            return
          }
          if (drawing.current) apply(event)
        }}
        onPointerUp={(event) => {
          pointers.current.delete(event.pointerId)
          pinch.current = null
          pan.current = null
          drawing.current = false
          last.current = -1
        }}
        onPointerCancel={(event) => {
          pointers.current.delete(event.pointerId)
          pinch.current = null
          pan.current = null
          drawing.current = false
          last.current = -1
        }}
        onPointerLeave={() => setHover(null)}
      />
      {hover && (
        <div
          className="pointer-events-none fixed z-10 flex max-w-56 items-center gap-2 rounded-md border bg-popover px-2.5 py-2 text-popover-foreground shadow-md"
          style={{ left: hover.left, top: hover.top }}
          role="status"
        >
          <span
            className="size-5 shrink-0 rounded-sm border"
            style={{ backgroundColor: pattern.colors[hover.value - 1].hex }}
          />
          <span className="min-w-0">
            <strong className="block text-xs">
              {pattern.colors[hover.value - 1].code} ·{" "}
              {pattern.colors[hover.value - 1].zh}
            </strong>
            <span className="block text-[10px] text-muted-foreground">
              {pattern.colors[hover.value - 1].brand} · 第 {hover.x + 1} 列 /{" "}
              {hover.y + 1} 行
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

function pointerDistance(pointers: Map<number, { x: number; y: number }>) {
  const [first, second] = [...pointers.values()]
  return Math.max(1, Math.hypot(second.x - first.x, second.y - first.y))
}

const clampZoom = (value: number) => Math.max(25, Math.min(800, value))
