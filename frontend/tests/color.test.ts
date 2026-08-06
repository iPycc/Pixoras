import { describe, expect, it } from "vitest"

import { deltaE, hexRgb, rgbLab } from "@/lib/color/lab"

describe("color", () => {
  it("converts RGB primaries to D65 Lab", () => {
    const white = rgbLab(hexRgb("#ffffff"))
    const red = rgbLab(hexRgb("#ff0000"))
    expect(white.l).toBeCloseTo(100, 3)
    expect(white.a).toBeCloseTo(0, 2)
    expect(red.l).toBeCloseTo(53.24, 1)
    expect(red.a).toBeCloseTo(80.09, 1)
  })

  it.each([
    [{ l: 50, a: 2.6772, b: -79.7751 }, { l: 50, a: 0, b: -82.7485 }, 2.0425],
    [{ l: 50, a: 3.1571, b: -77.2803 }, { l: 50, a: 0, b: -82.7485 }, 2.8615],
    [{ l: 50, a: 2.8361, b: -74.02 }, { l: 50, a: 0, b: -82.7485 }, 3.4412],
    [{ l: 50, a: 0, b: 0 }, { l: 50, a: -1, b: 2 }, 2.3669],
  ])("matches a CIEDE2000 reference pair", (first, second, expected) => {
    expect(deltaE(first, second)).toBeCloseTo(expected, 4)
  })
})
