import { describe, expect, it } from "vitest"

import { convert } from "@/lib/pattern/convert"
import { fill, paint, replace, total, usage } from "@/lib/pattern/edit"
import type { BeadColor } from "@/types/bead"
import { defaults, type Pattern } from "@/types/pattern"

const colors: BeadColor[] = [
  bead("black", "#000000"),
  bead("white", "#ffffff"),
  bead("pink", "#e85b8b"),
]

describe("pattern conversion", () => {
  it("keeps pixels below the alpha threshold empty", () => {
    const pattern = convert(image(2, 1, [255, 0, 0, 15, 255, 0, 0, 16]), colors, defaults)
    expect([...pattern.cells]).toEqual([0, 3])
  })

  it("respects the maximum number of colors", () => {
    const pattern = convert(
      image(3, 1, [0, 0, 0, 255, 255, 255, 255, 255, 232, 91, 139, 255]),
      colors,
      { ...defaults, maxColors: 1 }
    )
    expect(new Set([...pattern.cells].filter(Boolean)).size).toBe(1)
  })

  it("removes the color with the smallest total perceptual-error increase", () => {
    const palette = [
      bead("black", "#000000"),
      bead("near-black", "#010101"),
      bead("red", "#ff0000"),
    ]
    const pattern = convert(
      image(5, 1, [
        0, 0, 0, 255,
        0, 0, 0, 255,
        0, 0, 0, 255,
        1, 1, 1, 255,
        255, 0, 0, 255,
      ]),
      palette,
      { ...defaults, maxColors: 2 }
    )
    expect(new Set([...pattern.cells])).toEqual(new Set([1, 3]))
  })

  it("does not fill or dither across transparent gaps", () => {
    const pattern = convert(
      image(3, 1, [120, 120, 120, 255, 0, 0, 0, 0, 120, 120, 120, 255]),
      colors,
      { ...defaults, dither: true }
    )
    expect(pattern.cells[1]).toBe(0)
  })
})

describe("pattern editing", () => {
  const pattern: Pattern = {
    width: 3,
    height: 2,
    colors,
    cells: Uint16Array.from([1, 1, 0, 1, 2, 2]),
  }

  it("paints, fills and globally replaces without mutating the source", () => {
    const painted = paint(pattern, 2, 3)
    const filled = fill(pattern, 0, 3)
    const replaced = replace(pattern, 2, 1)
    expect([...pattern.cells]).toEqual([1, 1, 0, 1, 2, 2])
    expect(painted.cells[2]).toBe(3)
    expect([...filled.cells]).toEqual([3, 3, 0, 3, 2, 2])
    expect([...replaced.cells]).toEqual([1, 1, 0, 1, 1, 1])
  })

  it("calculates totals, counts and ratios without empty cells", () => {
    expect(total(pattern)).toBe(5)
    expect(usage(pattern).map(({ count, ratio }) => [count, ratio])).toEqual([
      [3, 0.6],
      [2, 0.4],
    ])
  })
})

function bead(id: string, hex: `#${string}`): BeadColor {
  return {
    id,
    brand: "自定义",
    series: "测试",
    code: id,
    zh: id,
    en: id,
    hex,
    effect: "solid",
    auto: true,
  }
}

function image(width: number, height: number, data: number[]) {
  return { width, height, data: Uint8ClampedArray.from(data) } as ImageData
}
