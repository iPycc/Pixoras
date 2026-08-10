import { describe, expect, it } from "vitest"

import { alphaBounds } from "@/lib/image"

describe("subject image cropping", () => {
  it("returns the occupied grid bounds at the conversion alpha threshold", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4)
    data[(1 * 4 + 1) * 4 + 3] = 16
    data[(2 * 4 + 3) * 4 + 3] = 255
    data[3] = 8

    expect(alphaBounds(data, 4, 4, 16)).toEqual({
      x: 1,
      y: 1,
      width: 3,
      height: 2,
    })
  })

  it("does not treat fully transparent cells as subject at alpha zero", () => {
    const data = new Uint8ClampedArray(2 * 3 * 4)
    expect(alphaBounds(data, 2, 3, 0)).toBeNull()
  })
})
