import { hexRgb } from "@/lib/color/lab"
import { total, usage } from "@/lib/pattern/edit"
import type { ExportOpts, Pattern } from "@/types/pattern"

const FONT =
  "'Noto Sans SC Variable','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif"

export function svgReport(pattern: Pattern, opts: ExportOpts, name: string) {
  const stats = usage(pattern)
  const maxSide = Math.max(pattern.width, pattern.height)
  const cell = Math.max(8, Math.min(opts.cellSize, Math.floor(2400 / maxSide)))
  const coord = opts.coords ? 34 : 16
  const boardWidth = pattern.width * cell
  const boardHeight = pattern.height * cell
  const boardX = coord + 24
  const boardY = coord + 24
  const boardAreaWidth = boardWidth + coord * 2 + 24
  const showReport = opts.mode === "report"
  const showLegend = showReport && opts.legend
  const legendCols = showLegend && stats.length > 20 ? 2 : 1
  const legendRows = showLegend ? Math.ceil(stats.length / legendCols) : 0
  const legendWidth = showReport ? (legendCols === 2 ? 610 : 390) : 0
  const legendHeight = showReport ? 210 + legendRows * 50 : 0
  const width = boardAreaWidth + legendWidth + (showReport ? 36 : 0)
  const creditHeight = !showReport ? 42 : 0
  const height =
    Math.max(boardHeight + coord * 2 + 48, legendHeight + 48) + creditHeight
  const background =
    opts.mode === "report" || !opts.transparent
      ? '<rect width="100%" height="100%" fill="#ffffff"/>'
      : ""

  const cells: string[] = []
  const codeLabels: string[] = []
  for (let y = 0; y < pattern.height; y++) {
    for (let x = 0; x < pattern.width; x++) {
      const value = pattern.cells[y * pattern.width + x]
      if (!value) continue
      const color = pattern.colors[value - 1]
      const px = boardX + x * cell
      const py = boardY + y * cell
      if (opts.shape === "circle") {
        cells.push(
          `<circle cx="${px + cell / 2}" cy="${py + cell / 2}" r="${cell * 0.41}" fill="${color.hex}"/>`
        )
      } else {
        cells.push(
          `<rect x="${px + 0.5}" y="${py + 0.5}" width="${cell - 1}" height="${cell - 1}" fill="${color.hex}"/>`
        )
      }
      if (opts.labels && cell >= 10) {
        codeLabels.push(
          `<text class="code ${darkText(color.hex) ? "dark-code" : "light-code"}" x="${px + cell / 2}" y="${py + cell / 2}" text-anchor="middle" dominant-baseline="central" font-size="${Math.max(6, Math.min(11, cell * 0.38))}">${escapeXml(color.code)}</text>`
        )
      }
    }
  }

  const guides: string[] = []
  if (opts.grid) {
    for (let x = 0; x <= pattern.width; x++) {
      const px = boardX + x * cell
      guides.push(`<path d="M${px} ${boardY}V${boardY + boardHeight}"/>`)
    }
    for (let y = 0; y <= pattern.height; y++) {
      const py = boardY + y * cell
      guides.push(`<path d="M${boardX} ${py}H${boardX + boardWidth}"/>`)
    }
  }
  if (opts.boards) {
    for (let x = 29; x < pattern.width; x += 29) {
      const px = boardX + x * cell
      guides.push(
        `<path class="board" d="M${px} ${boardY}V${boardY + boardHeight}"/>`
      )
    }
    for (let y = 29; y < pattern.height; y += 29) {
      const py = boardY + y * cell
      guides.push(
        `<path class="board" d="M${boardX} ${py}H${boardX + boardWidth}"/>`
      )
    }
  }

  const coordinates: string[] = []
  if (opts.coords) {
    const interval = maxSide <= 60 ? 1 : 5
    for (let x = 0; x < pattern.width; x += interval) {
      coordinates.push(
        `<text x="${boardX + (x + 0.5) * cell}" y="${boardY - 8}" text-anchor="middle">${x + 1}</text>`
      )
      coordinates.push(
        `<text x="${boardX + (x + 0.5) * cell}" y="${boardY + boardHeight + 16}" text-anchor="middle">${x + 1}</text>`
      )
    }
    for (let y = 0; y < pattern.height; y += interval) {
      coordinates.push(
        `<text x="${boardX - 8}" y="${boardY + (y + 0.68) * cell}" text-anchor="end">${y + 1}</text>`
      )
      coordinates.push(
        `<text x="${boardX + boardWidth + 8}" y="${boardY + (y + 0.68) * cell}">${y + 1}</text>`
      )
    }
  }

  const legendX = boardAreaWidth + 36
  const columnWidth = legendWidth / legendCols
  const creditText = [
    "Designed by Pixoras",
    opts.author ? `作者：${opts.authorName.trim() || "匿名作者"}` : "",
  ]
    .filter(Boolean)
    .join(" · ")
  const creditX = showReport ? legendX : boardX
  const credit = `<g class="credit" transform="translate(${creditX} ${height - 36})">
      ${brandMark()}
      <text x="30" y="15" class="signature">${escapeXml(creditText)}</text>
    </g>`
  const legend = showReport
    ? `<g class="legend">
        <text x="${legendX}" y="68" class="title">${escapeXml(name)}</text>
        <text x="${legendX}" y="98" class="muted">${pattern.width} × ${pattern.height} 格 · ${total(pattern)} 颗 · ${stats.length} 种颜色</text>
        <path d="M${legendX} 124H${width - 28}" stroke="#ded8d4"/>
        ${
          showLegend
            ? `<text x="${legendX}" y="158" class="heading">颜色与用量</text>
        ${stats
          .map((item, index) => {
            const column = Math.floor(index / legendRows)
            const row = index % legendRows
            const x = legendX + column * columnWidth
            const y = 194 + row * 50
            return `<g>
            <rect x="${x}" y="${y - 16}" width="28" height="28" rx="5" fill="${item.color.hex}" stroke="#cfc8c4"/>
            <text x="${x + 38}" y="${y - 5}" class="row">${escapeXml(item.color.code)} · ${escapeXml(item.color.zh)}</text>
            <text x="${x + 38}" y="${y + 12}" class="subrow">${escapeXml(item.color.brand)} ${escapeXml(item.color.series)} · ${escapeXml(item.color.en)}</text>
            <text x="${x + columnWidth - 14}" y="${y - 5}" text-anchor="end" class="count">${item.count} 颗</text>
            <text x="${x + columnWidth - 14}" y="${y + 12}" text-anchor="end" class="subrow">${(item.ratio * 100).toFixed(1)}%</text>
          </g>`
          })
          .join("")}`
            : `<text x="${legendX}" y="158" class="muted">材料清单未包含在本次图纸中</text>`
        }
        <text x="${legendX}" y="${height - 50}" class="note">屏幕色仅为近似值，制作前请与实物豆色核对。</text>
      </g>`
    : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" class="pixoras-svg-report" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>
      .pixoras-svg-report text{font-family:${FONT};font-size:10px;fill:#625a56}.pixoras-svg-report .grid path{stroke:#191716;stroke-opacity:.18;stroke-width:.7}.pixoras-svg-report .grid .board{stroke:#161311;stroke-opacity:.82;stroke-width:2}.pixoras-svg-report .code{font-weight:600}.pixoras-svg-report .dark-code{fill:#24201e}.pixoras-svg-report .light-code{fill:#fff}.pixoras-svg-report .signature{font-size:11px;font-weight:600;letter-spacing:.3px;fill:#625a56}.pixoras-svg-report .title{font-size:28px;font-weight:700;fill:#241f1d}.pixoras-svg-report .heading{font-size:16px;font-weight:700;fill:#241f1d}.pixoras-svg-report .muted{font-size:13px;fill:#7b716d}.pixoras-svg-report .row{font-size:13px;fill:#342f2c}.pixoras-svg-report .subrow{font-size:9px;fill:#8b817c}.pixoras-svg-report .count{font-size:13px;font-weight:700;fill:#342f2c}.pixoras-svg-report .note{font-size:11px;fill:#8b817c}
    </style>
    ${background}
    <g class="beads">${cells.join("")}</g>
    <g class="grid" fill="none">${guides.join("")}</g>
    <g class="codes">${codeLabels.join("")}</g>
    <g class="coords">${coordinates.join("")}</g>
    ${credit}
    ${legend}
  </svg>`
}

export async function saveSvg(
  pattern: Pattern,
  opts: ExportOpts,
  name: string
) {
  const text = svgReport(pattern, opts, name)
  await save(
    new Blob([text], { type: "image/svg+xml;charset=utf-8" }),
    fileName(name, pattern, "svg")
  )
}

export async function savePng(
  pattern: Pattern,
  opts: ExportOpts,
  name: string
) {
  const { blob } = await renderPng(pattern, opts, name, { scale: opts.scale })
  await save(blob, fileName(name, pattern, "png"))
}

export interface RenderPngOptions {
  scale?: number
  maxSide?: number
}

export interface RenderedPng {
  blob: Blob
  width: number
  height: number
}

export async function renderPng(
  pattern: Pattern,
  opts: ExportOpts,
  name: string,
  render: RenderPngOptions = {}
): Promise<RenderedPng> {
  await document.fonts?.ready
  const svg = svgReport(pattern, opts, name)
  const source = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
  try {
    const image = new Image()
    image.src = source
    await image.decode()
    const requestedScale = Math.max(0.1, render.scale ?? 1)
    const limitedScale = render.maxSide
      ? Math.min(
          requestedScale,
          render.maxSide / Math.max(image.naturalWidth, image.naturalHeight)
        )
      : requestedScale
    const width = Math.max(1, Math.round(image.naturalWidth * limitedScale))
    const height = Math.max(1, Math.round(image.naturalHeight * limitedScale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("无法创建导出画布")
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("PNG 生成失败"))),
        "image/png"
      )
    )
    return { blob, width, height }
  } finally {
    URL.revokeObjectURL(source)
  }
}

export function svgDimensions(svg: string) {
  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const width = Number(viewBox?.[1])
  const height = Number(viewBox?.[2])
  return {
    width: Number.isFinite(width) && width > 0 ? width : 1,
    height: Number.isFinite(height) && height > 0 ? height : 1,
  }
}

export async function saveCsv(pattern: Pattern, name: string) {
  const csv = csvText(pattern)
  await save(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    fileName(name, pattern, "csv")
  )
}

export function csvText(pattern: Pattern) {
  const rows = [
    ["品牌", "系列", "编号", "中文名", "英文名", "HEX", "数量", "占比"],
    ...usage(pattern).map((item) => [
      item.color.brand,
      item.color.series,
      item.color.code,
      item.color.zh,
      item.color.en,
      item.color.hex,
      String(item.count),
      `${(item.ratio * 100).toFixed(2)}%`,
    ]),
  ]
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`
}

export async function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const isWechat = /MicroMessenger/i.test(navigator.userAgent)
  if (isWechat) {
    window.open(url, "_blank", "noopener,noreferrer")
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return
  }
  const isIos = /iPad|iPhone|iPod/i.test(navigator.userAgent)
  if (isIos && navigator.canShare) {
    const file = new File([blob], name, { type: blob.type })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name })
        URL.revokeObjectURL(url)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          URL.revokeObjectURL(url)
          return
        }
      }
    }
  }
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000)
}

function fileName(name: string, pattern: Pattern, ext: string) {
  const safe = name.replace(/[\\/:*?"<>|]/g, "-").trim() || "未命名"
  const date = new Date().toISOString().slice(0, 10)
  return `Pixoras-${safe}-${pattern.width}x${pattern.height}-${date}.${ext}`
}

function darkText(hex: string) {
  const { r, g, b } = hexRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

function brandMark() {
  return `<g class="pixoras-brand-mark" transform="scale(0.34375)" aria-label="Pixoras logo">
      <rect width="64" height="64" rx="16" fill="#9F2F4F"/>
      <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#7B1F3C" stroke-opacity=".34" stroke-width="2"/>
      <g fill="#FFF3E8">
        <circle cx="17" cy="12" r="5"/><circle cx="17" cy="22" r="5"/><circle cx="17" cy="32" r="5"/><circle cx="17" cy="42" r="5"/><circle cx="17" cy="52" r="5"/>
      </g>
      <g fill="#FFBE55">
        <circle cx="27" cy="12" r="5"/><circle cx="37" cy="12" r="5"/>
      </g>
      <g fill="#FF8A66">
        <circle cx="43" cy="22" r="5"/><circle cx="37" cy="32" r="5"/><circle cx="27" cy="32" r="5"/>
      </g>
      <g fill="#9F2F4F">
        <circle cx="17" cy="12" r="1.45"/><circle cx="27" cy="12" r="1.45"/><circle cx="37" cy="12" r="1.45"/><circle cx="17" cy="22" r="1.45"/><circle cx="43" cy="22" r="1.45"/><circle cx="17" cy="32" r="1.45"/><circle cx="27" cy="32" r="1.45"/><circle cx="37" cy="32" r="1.45"/><circle cx="17" cy="42" r="1.45"/><circle cx="17" cy="52" r="1.45"/>
      </g>
      <g fill="#FFFFFF" fill-opacity=".5">
        <circle cx="15.5" cy="10.5" r=".9"/><circle cx="25.5" cy="10.5" r=".9"/><circle cx="35.5" cy="10.5" r=".9"/><circle cx="15.5" cy="20.5" r=".9"/><circle cx="41.5" cy="20.5" r=".9"/><circle cx="15.5" cy="30.5" r=".9"/><circle cx="25.5" cy="30.5" r=".9"/><circle cx="35.5" cy="30.5" r=".9"/><circle cx="15.5" cy="40.5" r=".9"/><circle cx="15.5" cy="50.5" r=".9"/>
      </g>
    </g>`
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    const map: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    }
    return map[character]
  })
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}
