export type PaletteId = "perler" | "hama"

export type BeadEffect =
  | "solid"
  | "clear"
  | "glitter"
  | "glow"
  | "stripe"

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Lab {
  l: number
  a: number
  b: number
}

export interface BeadColor {
  id: string
  brand: "Perler" | "Hama" | "自定义"
  series: string
  code: string
  zh: string
  en: string
  hex: `#${string}`
  effect: BeadEffect
  auto: boolean
}

export interface Palette {
  id: PaletteId
  name: string
  size: "5mm"
  source: string
  colors: BeadColor[]
}
