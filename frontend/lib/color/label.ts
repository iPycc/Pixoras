import type { BeadColor } from "@/types/bead"

type ColorLabel = Pick<BeadColor, "code" | "zh" | "en">

export function beadColorDetails(color: ColorLabel) {
  const seen = new Set([normalize(color.zh)])
  return [color.code, color.en]
    .filter((value) => {
      const key = normalize(value)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join(" · ")
}

const normalize = (value: string) => value.trim().toLowerCase()
