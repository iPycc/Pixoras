import { describe, expect, it } from "vitest"

import {
  completeColor,
  completeRow,
  makingStats,
  sanitizeCompleted,
  toggleCompleted,
} from "@/lib/progress"
import type { Pattern } from "@/types/pattern"

const pattern: Pattern = {
  width: 3,
  height: 2,
  colors: [],
  cells: Uint16Array.from([1, 1, 2, 0, 2, 2]),
}

describe("making progress", () => {
  it("sanitizes and toggles completed bead indexes", () => {
    expect(sanitizeCompleted([3, 1, 1, 99], pattern)).toEqual([1])
    expect(toggleCompleted([1], pattern, 2)).toEqual([1, 2])
    expect(toggleCompleted([1, 2], pattern, 1)).toEqual([2])
  })

  it("completes one color or one row", () => {
    expect(completeColor([], pattern, 2)).toEqual([2, 4, 5])
    expect(completeRow([], pattern, 1)).toEqual([0, 1, 2])
    expect(completeRow([], pattern, 2)).toEqual([4, 5])
  })

  it("reports completed and remaining bead totals", () => {
    expect(makingStats(pattern, [0, 2, 3])).toEqual({
      completed: 2,
      remaining: 3,
      total: 5,
      percent: 40,
    })
  })
})
