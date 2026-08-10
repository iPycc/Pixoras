import { describe, expect, it } from "vitest"

import { matteAlpha, normalizeMask } from "@/lib/subject"

describe("subject mask", () => {
  it("normalizes model output into a stable zero-to-one matte", () => {
    expect([...normalizeMask(Float32Array.from([-2, 0, 2]))]).toEqual([
      0, 0.5, 1,
    ])
    expect([...normalizeMask(Float32Array.from([4, 4]))]).toEqual([0, 0])
  })

  it("uses the edge threshold with a feathered transition", () => {
    expect(matteAlpha(0.1, 50)).toBe(0)
    expect(matteAlpha(0.5, 50)).toBeCloseTo(0.5)
    expect(matteAlpha(0.9, 50)).toBe(1)
    expect(matteAlpha(0.55, 70)).toBe(0)
  })
})
