import type { Lab, Rgb } from "@/types/bead"

export function hexRgb(hex: string): Rgb {
  const clean = hex.replace("#", "")
  const value = Number.parseInt(clean, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

export function rgbLab({ r, g, b }: Rgb): Lab {
  const linear = (value: number) => {
    const channel = value / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  }

  const red = linear(r)
  const green = linear(g)
  const blue = linear(b)
  const x = (red * 0.4124564 + green * 0.3575761 + blue * 0.1804375) / 0.95047
  const y = red * 0.2126729 + green * 0.7151522 + blue * 0.072175
  const z = (red * 0.0193339 + green * 0.119192 + blue * 0.9503041) / 1.08883
  const pivot = (value: number) =>
    value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116

  const fx = pivot(x)
  const fy = pivot(y)
  const fz = pivot(z)
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

const rad = (degrees: number) => (degrees * Math.PI) / 180
const deg = (radians: number) => (radians * 180) / Math.PI

export function deltaE(first: Lab, second: Lab): number {
  const c1 = Math.hypot(first.a, first.b)
  const c2 = Math.hypot(second.a, second.b)
  const meanC = (c1 + c2) / 2
  const g = 0.5 * (1 - Math.sqrt(meanC ** 7 / (meanC ** 7 + 25 ** 7)))
  const a1 = (1 + g) * first.a
  const a2 = (1 + g) * second.a
  const cp1 = Math.hypot(a1, first.b)
  const cp2 = Math.hypot(a2, second.b)

  const hue = (a: number, b: number) => {
    const value = deg(Math.atan2(b, a))
    return value < 0 ? value + 360 : value
  }

  const h1 = cp1 === 0 ? 0 : hue(a1, first.b)
  const h2 = cp2 === 0 ? 0 : hue(a2, second.b)
  const dl = second.l - first.l
  const dc = cp2 - cp1
  let dh = 0
  if (cp1 * cp2 !== 0) {
    const raw = h2 - h1
    dh = Math.abs(raw) <= 180 ? raw : raw > 180 ? raw - 360 : raw + 360
  }
  const dH = 2 * Math.sqrt(cp1 * cp2) * Math.sin(rad(dh / 2))
  const meanL = (first.l + second.l) / 2
  const meanCp = (cp1 + cp2) / 2
  let meanH = h1 + h2
  if (cp1 * cp2 === 0) meanH = h1 + h2
  else if (Math.abs(h1 - h2) <= 180) meanH /= 2
  else if (meanH < 360) meanH = (meanH + 360) / 2
  else meanH = (meanH - 360) / 2

  const t =
    1 -
    0.17 * Math.cos(rad(meanH - 30)) +
    0.24 * Math.cos(rad(2 * meanH)) +
    0.32 * Math.cos(rad(3 * meanH + 6)) -
    0.2 * Math.cos(rad(4 * meanH - 63))
  const sl = 1 + (0.015 * (meanL - 50) ** 2) / Math.sqrt(20 + (meanL - 50) ** 2)
  const sc = 1 + 0.045 * meanCp
  const sh = 1 + 0.015 * meanCp * t
  const rt =
    -2 *
    Math.sqrt(meanCp ** 7 / (meanCp ** 7 + 25 ** 7)) *
    Math.sin(rad(60 * Math.exp(-1 * ((meanH - 275) / 25) ** 2)))
  const l = dl / sl
  const c = dc / sc
  const h = dH / sh
  return Math.sqrt(l * l + c * c + h * h + rt * c * h)
}
