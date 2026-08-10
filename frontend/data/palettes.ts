import raw from "@/data/palette-data.json"
import type {
  BeadBrand,
  BeadColor,
  BeadEffect,
  BrandId,
  Palette,
  PaletteId,
  PaletteSource,
} from "@/types/bead"

type RawRow = [string, string, number, number, number, string]
type SourcePaletteId = Exclude<PaletteId, "mard-221">

const data = raw as {
  generatedAt: string
  palettes: Record<SourcePaletteId, RawRow[]>
}

interface Definition {
  id: PaletteId
  brandId: BrandId
  brand: Exclude<BeadBrand, "自定义">
  name: string
  series: string
  size: Palette["size"]
  hardness?: Palette["hardness"]
  form?: Palette["form"]
  advertisedColors?: number
  source: Omit<PaletteSource, "retrievedAt" | "approximate">
}

const definitions: Definition[] = [
  {
    id: "perler",
    brandId: "perler",
    brand: "Perler",
    name: "Perler Standard 5mm",
    series: "Standard",
    size: "5mm",
    form: "cylinder",
    advertisedColors: 102,
    source: {
      kind: "mixed",
      label: "Perler 2025 官方色号 · 社区 RGB 采样",
      url: "https://perler.com/content/uploaded_images/Perler_Bead-Color-Reference_2025.pdf",
    },
  },
  {
    id: "perler-mini",
    brandId: "perler",
    brand: "Perler",
    name: "Perler Mini 2.5mm",
    series: "Mini",
    size: "2.5mm",
    form: "cylinder",
    source: {
      kind: "community",
      label: "OneImage / beadcolors 社区 RGB 采样",
      url: "https://oneimage.co/zh/blogs/bead-brands-color-guide/",
    },
  },
  {
    id: "perler-caps",
    brandId: "perler",
    brand: "Perler",
    name: "Perler Caps",
    series: "Caps",
    size: "Caps",
    form: "cap",
    source: {
      kind: "community",
      label: "OneImage / beadcolors 社区 RGB 采样",
      url: "https://oneimage.co/zh/blogs/bead-brands-color-guide/",
    },
  },
  {
    id: "hama",
    brandId: "hama",
    brand: "Hama",
    name: "Hama Midi 5mm",
    series: "Midi",
    size: "5mm",
    form: "cylinder",
    advertisedColors: 80,
    source: {
      kind: "mixed",
      label: "Hama 官方色号 · 社区 RGB 采样",
      url: "https://www.hamabeads.com/wp-content/uploads/2023/05/Colour-Chart-2023.pdf",
    },
  },
  {
    id: "artkal-s",
    brandId: "artkal",
    brand: "Artkal",
    name: "Artkal S 5mm 硬豆",
    series: "S",
    size: "5mm",
    hardness: "hard",
    form: "cylinder",
    advertisedColors: 225,
    source: {
      kind: "mixed",
      label: "Artkal 官方 RGB 色卡 · 社区特殊色补充",
      url: "https://www.artkalfusebeads.com/pages/s-color-chart",
    },
  },
  {
    id: "artkal-r",
    brandId: "artkal",
    brand: "Artkal",
    name: "Artkal R 5mm 软豆",
    series: "R",
    size: "5mm",
    hardness: "soft",
    form: "cylinder",
    advertisedColors: 130,
    source: {
      kind: "community",
      label: "Artkal 官方系列 · 社区 RGB 采样",
      url: "https://www.artkalfusebeads.com/pages/r-color-chart",
    },
  },
  {
    id: "artkal-c",
    brandId: "artkal",
    brand: "Artkal",
    name: "Artkal C 2.6mm 硬豆",
    series: "C",
    size: "2.6mm",
    hardness: "hard",
    form: "cylinder",
    advertisedColors: 197,
    source: {
      kind: "mixed",
      label: "Artkal 官方 RGB 色卡 · 社区特殊色补充",
      url: "https://www.artkalfusebeads.com/pages/c-color-chart",
    },
  },
  {
    id: "artkal-a",
    brandId: "artkal",
    brand: "Artkal",
    name: "Artkal A 2.6mm 软豆",
    series: "A",
    size: "2.6mm",
    hardness: "soft",
    form: "cylinder",
    advertisedColors: 186,
    source: {
      kind: "community",
      label: "Artkal 官方系列 · 社区 RGB 采样",
      url: "https://www.artkalfusebeads.com/pages/a-color-chart",
    },
  },
  {
    id: "nabbi",
    brandId: "nabbi",
    brand: "Nabbi",
    name: "Nabbi Standard 5mm",
    series: "Standard",
    size: "5mm",
    form: "cylinder",
    source: {
      kind: "community",
      label: "OneImage / beadcolors 社区 RGB 采样",
      url: "https://oneimage.co/zh/blogs/bead-brands-color-guide/",
    },
  },
  {
    id: "yant",
    brandId: "yant",
    brand: "Yant",
    name: "Yant Standard 5mm",
    series: "Standard",
    size: "5mm",
    form: "cylinder",
    source: {
      kind: "community",
      label: "OneImage / beadcolors 社区 RGB 采样",
      url: "https://oneimage.co/zh/blogs/bead-brands-color-guide/",
    },
  },
  {
    id: "mard-221",
    brandId: "mard",
    brand: "MARD",
    name: "MARD 标准 221 色",
    series: "Standard 221",
    size: "2.6mm",
    form: "cylinder",
    advertisedColors: 221,
    source: {
      kind: "reference",
      label: "Pixel Beads 2026 MARD 屏幕参考色",
      url: "https://www.pixel-beads.com/zh/mard-bead-color-chart",
    },
  },
  {
    id: "mard-291",
    brandId: "mard",
    brand: "MARD",
    name: "MARD 全部 291 色",
    series: "Full 291",
    size: "2.6mm",
    form: "cylinder",
    advertisedColors: 291,
    source: {
      kind: "reference",
      label: "Pixel Beads 2026 MARD 屏幕参考色",
      url: "https://www.pixel-beads.com/zh/mard-bead-color-chart",
    },
  },
]

const standardMard = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "M"])

export const palettes = Object.fromEntries(
  definitions.map((definition) => {
    const sourceRows =
      data.palettes[definition.id === "mard-221" ? "mard-291" : definition.id]
    const rows =
      definition.id === "mard-221"
        ? sourceRows.filter(([code]) =>
            standardMard.has(code.match(/^[A-Z]+/)?.[0] ?? "")
          )
        : sourceRows
    return [definition.id, palette(definition, rows)]
  })
) as Record<PaletteId, Palette>

export const brands: Array<{
  id: BrandId
  label: string
  defaultPalette: PaletteId
}> = [
  { id: "mard", label: "MARD", defaultPalette: "mard-221" },
  { id: "artkal", label: "Artkal", defaultPalette: "artkal-s" },
  { id: "perler", label: "Perler", defaultPalette: "perler" },
  { id: "hama", label: "Hama", defaultPalette: "hama" },
  { id: "nabbi", label: "Nabbi", defaultPalette: "nabbi" },
  { id: "yant", label: "Yant", defaultPalette: "yant" },
]

export const mardTiers = [24, 48, 72, 96, 120, 144, 221, 291] as const
export type MardTier = (typeof mardTiers)[number]

export function getPalette(id: PaletteId) {
  return palettes[id]
}

export function getBrand(id: PaletteId) {
  return brands.find((brand) => brand.id === palettes[id].brandId) ?? brands[0]
}

export function getBrandPalettes(brandId: BrandId) {
  return definitions
    .filter((definition) => definition.brandId === brandId)
    .map((definition) => palettes[definition.id])
}

export function resolveMardTier(tier: MardTier) {
  return {
    palette: (tier === 291 ? "mard-291" : "mard-221") as PaletteId,
    maxColors: tier,
  }
}

export function currentMardTier(
  paletteId: PaletteId,
  maximum: number
): MardTier {
  if (paletteId === "mard-291") return 291
  return mardTiers.includes(maximum as MardTier) ? (maximum as MardTier) : 221
}

function palette(definition: Definition, rows: RawRow[]): Palette {
  return {
    ...definition,
    source: {
      ...definition.source,
      retrievedAt: data.generatedAt,
      approximate: true,
    },
    colors: rows.map(([code, name, r, g, b]) =>
      color(definition, code, name, r, g, b)
    ),
  }
}

function color(
  definition: Definition,
  code: string,
  name: string,
  r: number,
  g: number,
  b: number
): BeadColor {
  const effect = effectOf(name)
  return {
    id: `${definition.id}-${code.toLowerCase()}`,
    brand: definition.brand,
    series: `${definition.series} ${definition.size}`,
    code,
    zh: name,
    en: name,
    hex: `#${hex(r)}${hex(g)}${hex(b)}`,
    effect,
    auto: effect === "solid" || effect === "neon",
  }
}

function effectOf(name: string): BeadEffect {
  const value = name.toLowerCase()
  if (/clear|transparent|translucent/.test(value)) return "clear"
  if (/glitter/.test(value)) return "glitter"
  if (/glow|luminous/.test(value)) return "glow"
  if (/stripe/.test(value)) return "stripe"
  if (/gold|silver|copper|metallic/.test(value)) return "metallic"
  if (/pearl/.test(value)) return "pearl"
  if (/neon/.test(value)) return "neon"
  return "solid"
}

function hex(value: number) {
  return value.toString(16).padStart(2, "0").toUpperCase()
}
