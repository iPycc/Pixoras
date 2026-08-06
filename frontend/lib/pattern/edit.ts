import type { Pattern, Usage } from "@/types/pattern"

export function usage(pattern: Pattern): Usage[] {
  const counts = new Map<number, number>()
  for (const value of pattern.cells) {
    if (value > 0) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0)
  return [...counts.entries()]
    .map(([index, count]) => ({
      index,
      color: pattern.colors[index - 1],
      count,
      ratio: total ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export function total(pattern: Pattern) {
  let count = 0
  for (const value of pattern.cells) if (value > 0) count++
  return count
}

export function paint(pattern: Pattern, cell: number, color: number) {
  if (cell < 0 || cell >= pattern.cells.length) return pattern
  const cells = pattern.cells.slice()
  cells[cell] = color
  return { ...pattern, cells }
}

export function fill(pattern: Pattern, cell: number, color: number) {
  if (cell < 0 || cell >= pattern.cells.length) return pattern
  const target = pattern.cells[cell]
  if (target === color) return pattern
  const cells = pattern.cells.slice()
  const queue = [cell]
  const seen = new Uint8Array(cells.length)
  while (queue.length) {
    const index = queue.pop()!
    if (seen[index] || cells[index] !== target) continue
    seen[index] = 1
    cells[index] = color
    const x = index % pattern.width
    if (x > 0) queue.push(index - 1)
    if (x < pattern.width - 1) queue.push(index + 1)
    if (index >= pattern.width) queue.push(index - pattern.width)
    if (index < cells.length - pattern.width) queue.push(index + pattern.width)
  }
  return { ...pattern, cells }
}

export function replace(pattern: Pattern, from: number, to: number) {
  const cells = pattern.cells.slice()
  for (let index = 0; index < cells.length; index++) {
    if (cells[index] === from) cells[index] = to
  }
  return { ...pattern, cells }
}
