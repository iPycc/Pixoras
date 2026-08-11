import { describe, expect, it } from "vitest"

import {
  csvText,
  materialListSvgs,
  pdfTiles,
  svgDimensions,
  svgReport,
} from "@/lib/export"
import type { BeadColor } from "@/types/bead"
import type { ExportOpts, Pattern } from "@/types/pattern"

const color: BeadColor = {
  id: "pink",
  brand: "Perler",
  series: "Standard 5mm",
  code: "P11",
  zh: "粉色",
  en: "Pink",
  hex: "#EB78A8",
  effect: "solid",
  auto: true,
}

const pattern: Pattern = {
  width: 2,
  height: 2,
  colors: [color],
  cells: Uint16Array.from([1, 0, 1, 1]),
}

const codeOnlyPattern: Pattern = {
  width: 1,
  height: 1,
  colors: [
    {
      ...color,
      id: "mard-c1",
      brand: "MARD",
      series: "Standard 221 2.6mm",
      code: "C1",
      zh: "C1",
      en: "C1",
    },
  ],
  cells: Uint16Array.from([1]),
}

const opts: ExportOpts = {
  mode: "report",
  scale: 2,
  shape: "circle",
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

describe("exports", () => {
  it("creates a parseable-looking SVG report with Chinese and viewBox", () => {
    const svg = svgReport(pattern, opts, "小猫图纸")
    expect(svg).toMatch(/^<svg[^>]+viewBox="0 0 \d+ \d+"/)
    expect(svg).toContain("小猫图纸")
    expect(svg).toContain("Pixoras")
    expect(svg).toContain("Designed by Pixoras")
    expect(svg).toContain('class="pixoras-brand-header"')
    expect(svg).toContain('class="brand-name">Pixoras</text>')
    expect(svg).toContain(
      '<text x="136" y="25" class="brand-name-zh">拼好豆</text>'
    )
    expect(svg).toContain(
      ".brand-name-zh{font-size:16px;font-weight:600;fill:#241f1d}"
    )
    expect(svg).toContain('class="pixoras-brand-mark"')
    expect(svg).toContain('fill="#9F2F4F"')
    expect(svg).toContain('fill="#FFBE55"')
    expect(svg).toContain('fill="#FF8A66"')
    expect(svg).not.toContain('fill="#d3336c"')
    expect(svg).toContain("粉色")
    expect(svg).toContain('class="pixoras-svg-report"')
    const stylesheet = svg.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ""
    for (const rule of stylesheet
      .split("}")
      .map((value) => value.trim())
      .filter(Boolean)) {
      expect(rule).toMatch(/^\.pixoras-svg-report(?:\s|\.)/)
    }
    const beads = svg.match(/<g class="beads">([\s\S]*?)<\/g>/)?.[1] ?? ""
    expect(beads.match(/<circle /g)).toHaveLength(3)
    expect(svg).toContain(">P11</text>")
    expect(svgDimensions(svg)).toEqual({ width: 566, height: 348 })
  })

  it("falls back to safe dimensions for invalid SVG input", () => {
    expect(svgDimensions("<svg />")).toEqual({ width: 1, height: 1 })
  })

  it("removes repeated color codes from the export legend", () => {
    const svg = svgReport(codeOnlyPattern, opts, "MARD 图纸")
    expect(svg).toContain('class="row">C1</text>')
    expect(svg).toContain('class="subrow">MARD Standard 221 2.6mm</text>')
    expect(svg).not.toContain("C1 · C1")
  })

  it("includes the Pixoras credit in pure pattern exports", () => {
    const svg = svgReport(pattern, { ...opts, mode: "pattern" }, "小猫图纸")
    expect(svg).toContain("Designed by Pixoras")
  })

  it("supports optional author credit while keeping Pixoras credit", () => {
    const credited = svgReport(
      pattern,
      { ...opts, author: true, authorName: "小七" },
      "小猫图纸"
    )
    expect(credited).toContain("作者：小七")
    expect(credited).toContain("Designed by Pixoras")
  })

  it("creates an Excel-friendly CSV with BOM and matching count", () => {
    const csv = csvText(pattern)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('"中文名"')
    expect(csv).toContain('"粉色","Pink","#EB78A8","3","100.00%"')
  })

  it("splits printable PDFs on 29 by 29 pegboard boundaries", () => {
    const large: Pattern = {
      width: 58,
      height: 40,
      colors: [color],
      cells: Uint16Array.from({ length: 58 * 40 }, () => 1),
    }
    const tiles = pdfTiles(large)
    expect(tiles).toHaveLength(4)
    expect(
      tiles.map((tile) => [tile.startX, tile.startY, tile.endX, tile.endY])
    ).toEqual([
      [0, 0, 29, 29],
      [29, 0, 58, 29],
      [0, 29, 29, 40],
      [29, 29, 58, 40],
    ])
    expect(tiles[2].pattern.cells).toHaveLength(29 * 11)
  })

  it("creates paginated full-pattern material sheets", () => {
    const sheets = materialListSvgs(pattern, "小猫图纸")
    expect(sheets).toHaveLength(1)
    expect(sheets[0]).toContain("全图材料清单")
    expect(sheets[0]).toContain("P11 · 粉色")
    expect(sheets[0]).toContain("3 颗")
  })
})
