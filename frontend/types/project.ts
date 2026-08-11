import type { BeadColor } from "@/types/bead"
import type { BeadShape, Settings } from "@/types/pattern"

export interface Project {
  version: 1
  id: string
  name: string
  sourceName: string
  source?: Blob
  width: number
  height: number
  cells: number[]
  completed?: number[]
  colors: BeadColor[]
  shape?: BeadShape
  settings: Settings
  createdAt: number
  updatedAt: number
}
