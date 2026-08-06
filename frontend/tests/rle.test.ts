import { describe, expect, it } from "vitest"

import { decodeRle, encodeRle } from "@/lib/rle"

describe("rle", () => {
  it("round-trips a grid", () => {
    const cells = Uint16Array.from([0, 0, 0, 2, 2, 1, 0, 0])
    const encoded = encodeRle(cells)
    expect(encoded).toEqual([0, 3, 2, 2, 1, 1, 0, 2])
    expect([...decodeRle(encoded, cells.length)]).toEqual([...cells])
  })

  it("rejects malformed data", () => {
    expect(() => decodeRle([1, 5], 4)).toThrow("压缩数据无效")
    expect(() => decodeRle([1, 2], 4)).toThrow("尺寸与压缩数据不匹配")
  })
})
