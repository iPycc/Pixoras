import { describe, expect, it } from "vitest"

import {
  analyzeSubject,
  matteAlpha,
  normalizeMask,
  subjectBounds,
  type SubjectMask,
} from "@/lib/subject"

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

  it("finds the meaningful subject bounds while ignoring isolated mask noise", () => {
    const mask = createMask(10, 10)
    for (let y = 2; y <= 7; y++) {
      for (let x = 4; x <= 6; x++) mask.data[y * mask.width + x] = 1
    }
    mask.data[9 * mask.width] = 1

    expect(subjectBounds(mask, 50)).toEqual({
      x: 0.3,
      y: 0.1,
      width: 0.5,
      height: 0.8,
    })
  })

  it("returns no focus box when the model finds no foreground", () => {
    expect(subjectBounds(createMask(8, 8), 50)).toBeNull()
  })

  it("counts meaningful foreground components and recommends a grid", () => {
    const mask = createMask(20, 10)
    for (let y = 2; y <= 7; y++) {
      for (let x = 2; x <= 6; x++) mask.data[y * mask.width + x] = 1
      for (let x = 13; x <= 17; x++) mask.data[y * mask.width + x] = 1
    }

    expect(analyzeSubject(mask)).toMatchObject({
      hasSubject: true,
      componentCount: 2,
      recommendedSize: 87,
    })
  })

  it("treats an almost fully foreground mask as a complete scene", () => {
    const mask = createMask(10, 10)
    mask.data.fill(1)
    expect(analyzeSubject(mask)).toMatchObject({
      hasSubject: false,
      componentCount: 0,
      recommendedSize: 58,
    })
  })
})

function createMask(width: number, height: number): SubjectMask {
  return { width, height, data: new Float32Array(width * height) }
}
