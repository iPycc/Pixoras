import type { BeadColor } from "@/types/bead"
import type { Pattern } from "@/types/pattern"

export const INVENTORY_KEY = "pixoras.inventory.v1"
export const INVENTORY_CHANGED = "pixoras:inventory-changed"

export type InventoryCounts = Record<string, number>

export interface Shortage {
  color: BeadColor
  needed: number
  owned: number
  missing: number
}

export function readInventory(): InventoryCounts {
  if (typeof window === "undefined") return {}
  try {
    const value = JSON.parse(window.localStorage.getItem(INVENTORY_KEY) ?? "{}")
    if (!value || typeof value !== "object" || Array.isArray(value)) return {}
    return sanitizeInventory(value as Record<string, unknown>)
  } catch {
    return {}
  }
}

export function writeInventory(counts: InventoryCounts) {
  if (typeof window === "undefined") return
  const clean = sanitizeInventory(counts)
  window.localStorage.setItem(INVENTORY_KEY, JSON.stringify(clean))
  window.dispatchEvent(new CustomEvent(INVENTORY_CHANGED, { detail: clean }))
}

export function inventoryColors(
  colors: BeadColor[],
  counts: InventoryCounts,
  enabled = true
) {
  if (!enabled) return colors
  return colors.filter((color) => (counts[color.id] ?? 0) > 0)
}

export function inventoryColorCount(
  colors: BeadColor[],
  counts: InventoryCounts
) {
  return inventoryColors(colors, counts).length
}

export function shortages(pattern: Pattern, counts: InventoryCounts) {
  const needed = new Map<number, number>()
  for (const value of pattern.cells) {
    if (value) needed.set(value, (needed.get(value) ?? 0) + 1)
  }
  return [...needed.entries()]
    .map(([index, count]): Shortage => {
      const color = pattern.colors[index - 1]
      const owned = Math.max(0, counts[color.id] ?? 0)
      return {
        color,
        needed: count,
        owned,
        missing: Math.max(0, count - owned),
      }
    })
    .filter((item) => item.missing > 0)
    .sort((a, b) => b.missing - a.missing)
}

export function shortageCsv(pattern: Pattern, counts: InventoryCounts) {
  const rows = [
    ["品牌", "系列", "色号", "颜色", "需要", "已有", "缺少"],
    ...shortages(pattern, counts).map((item) => [
      item.color.brand,
      item.color.series,
      item.color.code,
      item.color.zh,
      String(item.needed),
      String(item.owned),
      String(item.missing),
    ]),
  ]
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`
}

function sanitizeInventory(value: Record<string, unknown>) {
  const clean: InventoryCounts = {}
  for (const [id, count] of Object.entries(value)) {
    const amount = Math.floor(Number(count))
    if (id && Number.isFinite(amount) && amount > 0) clean[id] = amount
  }
  return clean
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}
