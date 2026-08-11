import type { Pattern } from "@/types/pattern"

export interface MakingStats {
  completed: number
  remaining: number
  total: number
  percent: number
}

export function sanitizeCompleted(values: number[], pattern: Pattern) {
  return [...new Set(values)]
    .filter(
      (index) =>
        Number.isInteger(index) &&
        index >= 0 &&
        index < pattern.cells.length &&
        pattern.cells[index] > 0
    )
    .sort((a, b) => a - b)
}

export function toggleCompleted(
  values: number[],
  pattern: Pattern,
  index: number
) {
  const completed = new Set(sanitizeCompleted(values, pattern))
  if (index < 0 || index >= pattern.cells.length || !pattern.cells[index]) {
    return [...completed]
  }
  if (completed.has(index)) completed.delete(index)
  else completed.add(index)
  return [...completed].sort((a, b) => a - b)
}

export function completeColor(
  values: number[],
  pattern: Pattern,
  color: number
) {
  const completed = new Set(sanitizeCompleted(values, pattern))
  for (let index = 0; index < pattern.cells.length; index++) {
    if (pattern.cells[index] === color) completed.add(index)
  }
  return [...completed].sort((a, b) => a - b)
}

export function completeRow(values: number[], pattern: Pattern, row: number) {
  const completed = new Set(sanitizeCompleted(values, pattern))
  const y = Math.max(0, Math.min(pattern.height - 1, Math.floor(row) - 1))
  const start = y * pattern.width
  for (let index = start; index < start + pattern.width; index++) {
    if (pattern.cells[index]) completed.add(index)
  }
  return [...completed].sort((a, b) => a - b)
}

export function makingStats(pattern: Pattern, values: number[]): MakingStats {
  const completed = sanitizeCompleted(values, pattern).length
  let total = 0
  for (const value of pattern.cells) if (value) total++
  return {
    completed,
    remaining: Math.max(0, total - completed),
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  }
}
