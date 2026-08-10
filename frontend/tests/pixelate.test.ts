import { describe, expect, it } from "vitest"

import {
  clearConnectedWhiteBackground,
  DEFAULT_PIXEL_STRENGTH,
  pixelBlockSize,
  pixelGridSize,
} from "@/lib/pixelate"

describe("pixelate", () => {
  it("keeps the default strength lossless", () => {
    expect(pixelBlockSize(DEFAULT_PIXEL_STRENGTH)).toBe(1)
  })

  it("uses larger blocks as strength increases", () => {
    const sizes = Array.from({ length: 10 }, (_, index) =>
      pixelBlockSize(index + 1)
    )
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
    expect(sizes[9]).toBeGreaterThan(sizes[0])
  })

  it("keeps strength one lossless before bead conversion", () => {
    expect(pixelBlockSize(1)).toBe(1)
  })

  it("removes only white background connected to the image edge", () => {
    const pixels = new Uint8ClampedArray(5 * 5 * 4).fill(255)
    const set = (
      x: number,
      y: number,
      red: number,
      green: number,
      blue: number
    ) => {
      const offset = (y * 5 + x) * 4
      pixels[offset] = red
      pixels[offset + 1] = green
      pixels[offset + 2] = blue
      pixels[offset + 3] = 255
    }
    for (let value = 1; value < 4; value++) {
      set(value, 1, 20, 20, 20)
      set(value, 3, 20, 20, 20)
      set(1, value, 20, 20, 20)
      set(3, value, 20, 20, 20)
    }

    clearConnectedWhiteBackground(pixels, 5, 5)

    expect(pixels[3]).toBe(0)
    expect(pixels[(2 * 5 + 2) * 4 + 3]).toBe(255)
  })

  it("reduces the logical pixel grid without changing aspect", () => {
    expect(pixelGridSize(800, 400, 4)).toEqual({ width: 100, height: 50 })
  })
})
