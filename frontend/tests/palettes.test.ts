import { describe, expect, it } from "vitest"

import {
  getPalette,
  mardTiers,
  palettes,
  resolveMardTier,
} from "@/data/palettes"
import { convert } from "@/lib/pattern/convert"
import { defaults } from "@/types/pattern"

describe("brand palettes", () => {
  it.each([
    ["perler", 102],
    ["perler-mini", 41],
    ["perler-caps", 26],
    ["hama", 80],
    ["artkal-s", 210],
    ["artkal-r", 89],
    ["artkal-c", 174],
    ["artkal-a", 145],
    ["nabbi", 30],
    ["yant", 119],
    ["mard-221", 221],
    ["mard-291", 291],
  ] as const)("loads %s reference colors", (paletteId, count) => {
    expect(getPalette(paletteId).colors).toHaveLength(count)
  })

  it("keeps codes and internal ids unique within every palette", () => {
    for (const palette of Object.values(palettes)) {
      expect(new Set(palette.colors.map((color) => color.code)).size).toBe(
        palette.colors.length
      )
      expect(new Set(palette.colors.map((color) => color.id)).size).toBe(
        palette.colors.length
      )
    }
  })

  it("builds the standard MARD 221 set as a subset of all 291 colors", () => {
    const all = new Set(
      getPalette("mard-291").colors.map((color) => color.code)
    )
    expect(
      getPalette("mard-221").colors.every((color) => all.has(color.code))
    ).toBe(true)
    expect(mardTiers).toEqual([24, 48, 72, 96, 120, 144, 221, 291])
    expect(resolveMardTier(144)).toEqual({
      palette: "mard-221",
      maxColors: 144,
    })
    expect(resolveMardTier(291)).toEqual({
      palette: "mard-291",
      maxColors: 291,
    })
  })

  it("reduces a full MARD palette without returning foreign colors", () => {
    const palette = getPalette("mard-291")
    const data: number[] = []
    for (let index = 0; index < 32; index++) {
      data.push(
        (index * 47) % 256,
        (index * 83) % 256,
        (index * 131) % 256,
        255
      )
    }
    const pattern = convert(
      { width: 8, height: 4, data: Uint8ClampedArray.from(data) } as ImageData,
      palette.colors,
      { ...defaults, palette: "mard-291", width: 8, height: 4, maxColors: 24 }
    )
    expect(
      new Set([...pattern.cells].filter(Boolean)).size
    ).toBeLessThanOrEqual(24)
    expect(pattern.colors).toBe(palette.colors)
  })
})
