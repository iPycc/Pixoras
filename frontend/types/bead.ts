export type BrandId = "perler" | "hama" | "artkal" | "nabbi" | "yant" | "mard"

export type PaletteId =
  | "perler"
  | "perler-mini"
  | "perler-caps"
  | "hama"
  | "artkal-s"
  | "artkal-r"
  | "artkal-c"
  | "artkal-a"
  | "nabbi"
  | "yant"
  | "mard-221"
  | "mard-291"

export type BeadBrand =
  "Perler" | "Hama" | "Artkal" | "Nabbi" | "Yant" | "MARD" | "自定义"

export type BeadSize = "5mm" | "2.6mm" | "2.5mm" | "Caps"

export type BeadEffect =
  | "solid"
  | "clear"
  | "glitter"
  | "glow"
  | "metallic"
  | "pearl"
  | "neon"
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
  brand: BeadBrand
  series: string
  code: string
  zh: string
  en: string
  hex: `#${string}`
  effect: BeadEffect
  auto: boolean
}

export interface PaletteSource {
  kind: "official" | "mixed" | "community" | "reference"
  label: string
  url: string
  retrievedAt: string
  approximate: true
}

export interface Palette {
  id: PaletteId
  brandId: BrandId
  brand: Exclude<BeadBrand, "自定义">
  name: string
  series: string
  size: BeadSize
  hardness?: "hard" | "soft"
  form?: "cylinder" | "cap"
  advertisedColors?: number
  source: PaletteSource
  colors: BeadColor[]
}
