import type { BeadColor, PaletteId } from "@/types/bead"

export type Tool = "paint" | "erase" | "pick" | "fill" | "pan" | "progress"
export type BeadShape = "circle" | "square"

export interface Settings {
  width: number
  height: number
  lockRatio: boolean
  palette: PaletteId
  maxColors: number
  inventoryOnly: boolean
  alpha: number
  dither: boolean
  pixelArt: boolean
  subjectOnly: boolean
  subjectAutoFit: boolean
  subjectThreshold: number
  removeWhite: boolean
  background: `#${string}`
  tolerance: number
  brightness: number
  contrast: number
  saturation: number
  rotation: 0 | 90 | 180 | 270
  flipX: boolean
  flipY: boolean
  scale: number
  offsetX: number
  offsetY: number
}

export interface Pattern {
  width: number
  height: number
  cells: Uint16Array
  colors: BeadColor[]
}

export interface Usage {
  index: number
  color: BeadColor
  count: number
  ratio: number
}

export interface ExportOpts {
  mode: "report" | "pattern"
  scale: 2 | 4
  shape: BeadShape
  cellSize: number
  grid: boolean
  coords: boolean
  boards: boolean
  labels: boolean
  legend: boolean
  transparent: boolean
  author: boolean
  authorName: string
}

export const defaults: Settings = {
  width: 58,
  height: 58,
  lockRatio: true,
  palette: "perler",
  maxColors: 48,
  inventoryOnly: false,
  alpha: 16,
  dither: false,
  pixelArt: false,
  subjectOnly: false,
  subjectAutoFit: false,
  subjectThreshold: 50,
  removeWhite: false,
  background: "#FFFFFF",
  tolerance: 24,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  rotation: 0,
  flipX: false,
  flipY: false,
  scale: 100,
  offsetX: 0,
  offsetY: 0,
}
