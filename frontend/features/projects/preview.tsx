"use client"

import * as React from "react"

import type { Project } from "@/types/project"

export function ProjectPreview({ project }: { project: Project }) {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const draw = () => drawProject(canvas, project)
    draw()

    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [project])

  const beadCount = project.cells.reduce(
    (count, value) => count + (value ? 1 : 0),
    0
  )

  return (
    <canvas
      ref={ref}
      className="aspect-[4/3] w-full"
      role="img"
      aria-label={`${project.name}，${project.width} × ${project.height} 格，共 ${beadCount} 颗豆`}
    />
  )
}

function drawProject(canvas: HTMLCanvasElement, project: Project) {
  const width = Math.max(1, canvas.clientWidth)
  const height = Math.max(1, canvas.clientHeight)
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const pixelWidth = Math.round(width * ratio)
  const pixelHeight = Math.round(height * ratio)

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }

  const context = canvas.getContext("2d")
  if (!context) return
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)

  // Previews are intentionally theme-independent: the paper and bead HEX colors
  // should remain a reliable material reference in both themes.
  context.fillStyle = "#ECE9E3"
  context.fillRect(0, 0, width, height)

  const margin = Math.max(10, width * 0.035)
  const paperX = margin
  const paperY = margin
  const paperWidth = width - margin * 2
  const paperHeight = height - margin * 2
  const titleHeight = Math.max(24, Math.min(34, paperHeight * 0.14))

  context.shadowColor = "rgba(55, 45, 40, 0.12)"
  context.shadowBlur = 10
  context.shadowOffsetY = 3
  context.fillStyle = "#FFFDF9"
  context.fillRect(paperX, paperY, paperWidth, paperHeight)
  context.shadowColor = "transparent"
  context.strokeStyle = "#BEB7AF"
  context.lineWidth = 1
  context.strokeRect(
    paperX + 0.5,
    paperY + 0.5,
    paperWidth - 1,
    paperHeight - 1
  )

  const boardInset = Math.max(12, width * 0.045)
  const boardAreaWidth = paperWidth - boardInset * 2
  const boardAreaHeight = paperHeight - titleHeight - boardInset * 1.6
  const cell = Math.min(
    boardAreaWidth / project.width,
    boardAreaHeight / project.height
  )
  const boardWidth = cell * project.width
  const boardHeight = cell * project.height
  const boardX = paperX + (paperWidth - boardWidth) / 2
  const boardY = paperY + boardInset * 0.7 + (boardAreaHeight - boardHeight) / 2

  context.fillStyle = "#FBFAF7"
  context.fillRect(boardX, boardY, boardWidth, boardHeight)

  for (let y = 0; y < project.height; y++) {
    for (let x = 0; x < project.width; x++) {
      const value = project.cells[y * project.width + x]
      if (!value) continue
      const color = project.colors[value - 1]
      if (!color) continue
      context.fillStyle = color.hex
      if ((project.shape ?? "square") === "circle" && cell >= 2.5) {
        context.beginPath()
        context.arc(
          boardX + (x + 0.5) * cell,
          boardY + (y + 0.5) * cell,
          cell * 0.39,
          0,
          Math.PI * 2
        )
        context.fill()
      } else {
        const gap = cell >= 3 ? Math.min(0.7, cell * 0.08) : 0
        context.fillRect(
          boardX + x * cell + gap,
          boardY + y * cell + gap,
          Math.max(0.5, cell - gap * 2),
          Math.max(0.5, cell - gap * 2)
        )
      }
    }
  }

  if (cell >= 3) {
    context.beginPath()
    context.lineWidth = 0.5
    context.strokeStyle = "rgba(46, 40, 37, 0.18)"
    for (let x = 0; x <= project.width; x++) {
      const lineX = boardX + x * cell
      context.moveTo(lineX, boardY)
      context.lineTo(lineX, boardY + boardHeight)
    }
    for (let y = 0; y <= project.height; y++) {
      const lineY = boardY + y * cell
      context.moveTo(boardX, lineY)
      context.lineTo(boardX + boardWidth, lineY)
    }
    context.stroke()
  } else {
    context.strokeStyle = "rgba(46, 40, 37, 0.28)"
    context.strokeRect(boardX, boardY, boardWidth, boardHeight)
  }

  context.beginPath()
  context.lineWidth = 1.25
  context.strokeStyle = "#C93E6A"
  for (let x = 29; x < project.width; x += 29) {
    const lineX = boardX + x * cell
    context.moveTo(lineX, boardY)
    context.lineTo(lineX, boardY + boardHeight)
  }
  for (let y = 29; y < project.height; y += 29) {
    const lineY = boardY + y * cell
    context.moveTo(boardX, lineY)
    context.lineTo(boardX + boardWidth, lineY)
  }
  context.stroke()

  const titleY = paperY + paperHeight - titleHeight
  context.beginPath()
  context.lineWidth = 1
  context.strokeStyle = "#BEB7AF"
  context.moveTo(paperX, titleY)
  context.lineTo(paperX + paperWidth, titleY)
  context.moveTo(paperX + paperWidth * 0.66, titleY)
  context.lineTo(paperX + paperWidth * 0.66, paperY + paperHeight)
  context.stroke()

  context.fillStyle = "#564F4A"
  context.textBaseline = "middle"
  context.font = `${Math.max(7, Math.min(10, width * 0.024))}px ui-monospace, monospace`
  context.fillText("PIXORAS / PATTERN", paperX + 8, titleY + titleHeight / 2)
  context.textAlign = "center"
  context.fillText(
    `${project.width} × ${project.height}`,
    paperX + paperWidth * 0.83,
    titleY + titleHeight / 2
  )
  context.textAlign = "start"
}
