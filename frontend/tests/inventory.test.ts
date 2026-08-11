import { describe, expect, it } from "vitest"

import { inventoryColors, shortageCsv, shortages } from "@/lib/inventory"
import type { BeadColor } from "@/types/bead"
import type { Pattern } from "@/types/pattern"

const pink: BeadColor = {
  id: "pink",
  brand: "Perler",
  series: "Standard",
  code: "P11",
  zh: "粉色",
  en: "Pink",
  hex: "#EB78A8",
  effect: "solid",
  auto: true,
}

const black: BeadColor = {
  ...pink,
  id: "black",
  code: "P18",
  zh: "黑色",
  en: "Black",
  hex: "#222222",
}

const pattern: Pattern = {
  width: 3,
  height: 2,
  colors: [pink, black],
  cells: Uint16Array.from([1, 1, 2, 0, 2, 2]),
}

describe("bead inventory", () => {
  it("limits conversion candidates to colors with stock", () => {
    expect(inventoryColors([pink, black], { pink: 20 })).toEqual([pink])
    expect(inventoryColors([pink, black], {}, false)).toEqual([pink, black])
  })

  it("calculates shortages from needed and owned quantities", () => {
    expect(shortages(pattern, { pink: 1, black: 5 })).toEqual([
      { color: pink, needed: 2, owned: 1, missing: 1 },
    ])
  })

  it("exports an Excel-friendly shortage shopping list", () => {
    const csv = shortageCsv(pattern, { pink: 1 })
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('"P18","黑色","3","0","3"')
    expect(csv).toContain('"P11","粉色","2","1","1"')
  })
})
