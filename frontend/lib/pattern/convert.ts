import { deltaE, hexRgb, rgbLab } from "@/lib/color/lab"
import type { BeadColor, Lab, Rgb } from "@/types/bead"
import type { Pattern, Settings } from "@/types/pattern"

type Prepared = { index: number; color: BeadColor; rgb: Rgb; lab: Lab }

export function convert(
  image: ImageData,
  colors: BeadColor[],
  settings: Settings
): Pattern {
  const prepared = colors.map((color, index) => ({
    index,
    color,
    rgb: hexRgb(color.hex),
    lab: rgbLab(hexRgb(color.hex)),
  }))
  const candidates = prepared.filter((item) => item.color.auto)
  const samples = collect(image, settings)
  const active = selectColors(samples, candidates, settings.maxColors)
  const cells = settings.dither
    ? dither(samples, image.width, image.height, active)
    : Uint16Array.from(
        samples.map((sample) =>
          sample ? nearest(sample.rgb, sample.lab, active).index + 1 : 0
        )
      )
  return { width: image.width, height: image.height, cells, colors }
}

function collect(image: ImageData, settings: Settings) {
  const samples: Array<{ rgb: Rgb; lab: Lab } | null> = []
  const background = hexRgb(settings.background ?? "#FFFFFF")
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const r = image.data[offset]
    const g = image.data[offset + 1]
    const b = image.data[offset + 2]
    const alpha = image.data[offset + 3]
    const backgroundDistance = Math.hypot(
      background.r - r,
      background.g - g,
      background.b - b
    )
    if (
      alpha < settings.alpha ||
      (settings.removeWhite && backgroundDistance <= settings.tolerance * 4.42)
    ) {
      samples.push(null)
      continue
    }
    const rgb = { r, g, b }
    samples.push({ rgb, lab: rgbLab(rgb) })
  }
  return samples
}

function nearest(_rgb: Rgb, lab: Lab, colors: Prepared[]) {
  let best = colors[0]
  let distance = Number.POSITIVE_INFINITY
  for (const color of colors) {
    const value = deltaE(lab, color.lab)
    if (value < distance) {
      distance = value
      best = color
    }
  }
  if (!best) throw new Error("当前色卡没有可用于自动匹配的颜色")
  return best
}

function selectColors(
  samples: Array<{ rgb: Rgb; lab: Lab } | null>,
  colors: Prepared[],
  maximum: number
) {
  if (colors.length === 0) throw new Error("当前色卡没有可用于自动匹配的颜色")
  const max = Math.max(1, Math.min(maximum, colors.length))
  if (colors.length <= max) return colors

  const distances = new Float32Array(samples.length * colors.length)
  samples.forEach((sample, sampleIndex) => {
    if (!sample) return
    colors.forEach((color, colorIndex) => {
      distances[sampleIndex * colors.length + colorIndex] = deltaE(sample.lab, color.lab)
    })
  })

  const active = new Set(colors.map((_, index) => index))
  while (active.size > max) {
    const cost = new Float64Array(colors.length)
    for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
      if (!samples[sampleIndex]) continue
      let best = -1
      let bestDistance = Number.POSITIVE_INFINITY
      let secondDistance = Number.POSITIVE_INFINITY
      for (const colorIndex of active) {
        const distance = distances[sampleIndex * colors.length + colorIndex]
        if (distance < bestDistance) {
          secondDistance = bestDistance
          bestDistance = distance
          best = colorIndex
        } else if (distance < secondDistance) {
          secondDistance = distance
        }
      }
      if (best >= 0 && Number.isFinite(secondDistance)) {
        cost[best] += secondDistance - bestDistance
      }
    }

    let remove = -1
    let smallest = Number.POSITIVE_INFINITY
    for (const colorIndex of active) {
      if (cost[colorIndex] < smallest) {
        smallest = cost[colorIndex]
        remove = colorIndex
      }
    }
    if (remove < 0) break
    active.delete(remove)
  }
  return colors.filter((_, index) => active.has(index))
}

function dither(
  samples: Array<{ rgb: Rgb; lab: Lab } | null>,
  width: number,
  height: number,
  colors: Prepared[]
) {
  const work = new Float32Array(samples.length * 3)
  samples.forEach((sample, index) => {
    if (!sample) return
    work[index * 3] = sample.rgb.r
    work[index * 3 + 1] = sample.rgb.g
    work[index * 3 + 2] = sample.rgb.b
  })
  const cells = new Uint16Array(samples.length)
  const spread = (x: number, y: number, error: Rgb, weight: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const index = y * width + x
    if (!samples[index]) return
    work[index * 3] += error.r * weight
    work[index * 3 + 1] += error.g * weight
    work[index * 3 + 2] += error.b * weight
  }
  for (let y = 0; y < height; y++) {
    const reverse = y % 2 === 1
    for (let step = 0; step < width; step++) {
      const x = reverse ? width - 1 - step : step
      const index = y * width + x
      if (!samples[index]) continue
      const rgb = {
        r: clamp(work[index * 3]),
        g: clamp(work[index * 3 + 1]),
        b: clamp(work[index * 3 + 2]),
      }
      const match = nearest(rgb, rgbLab(rgb), colors)
      cells[index] = match.index + 1
      const error = {
        r: rgb.r - match.rgb.r,
        g: rgb.g - match.rgb.g,
        b: rgb.b - match.rgb.b,
      }
      const direction = reverse ? -1 : 1
      spread(x + direction, y, error, 7 / 16)
      spread(x - direction, y + 1, error, 3 / 16)
      spread(x, y + 1, error, 5 / 16)
      spread(x + direction, y + 1, error, 1 / 16)
    }
  }
  return cells
}

const clamp = (value: number) => Math.max(0, Math.min(255, value))
