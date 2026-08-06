import type { Settings } from "@/types/pattern"

const MAX_BYTES = 25 * 1024 * 1024
const MAX_EDGE = 8192
const SAMPLE = 4

export async function readImage(file: File, settings: Settings) {
  const internalSample =
    file.name === "pixoras-demo.svg" && file.type === "image/svg+xml"
  if (!internalSample && !/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error("请选择 PNG、JPEG 或 WebP 图片")
  }
  if (file.size > MAX_BYTES) throw new Error("图片不能超过 25MB")

  const source = await load(file)
  const sourceWidth = source.width
  const sourceHeight = source.height
  if (Math.max(sourceWidth, sourceHeight) > MAX_EDGE) {
    close(source)
    throw new Error("图片最长边不能超过 8192 像素")
  }

  const canvas = document.createElement("canvas")
  canvas.width = settings.width * SAMPLE
  canvas.height = settings.height * SAMPLE
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("当前浏览器无法创建图像画布")

  const turn = settings.rotation === 90 || settings.rotation === 270
  const imageWidth = turn ? sourceHeight : sourceWidth
  const imageHeight = turn ? sourceWidth : sourceHeight
  const cover = Math.max(canvas.width / imageWidth, canvas.height / imageHeight)
  const scale = cover * (settings.scale / 100)

  context.save()
  context.translate(
    canvas.width / 2 + (settings.offsetX / 100) * canvas.width,
    canvas.height / 2 + (settings.offsetY / 100) * canvas.height
  )
  context.rotate((settings.rotation * Math.PI) / 180)
  context.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1)
  context.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(
    source,
    -(sourceWidth * scale) / 2,
    -(sourceHeight * scale) / 2,
    sourceWidth * scale,
    sourceHeight * scale
  )
  context.restore()
  close(source)
  return alphaSample(
    context.getImageData(0, 0, canvas.width, canvas.height),
    settings.width,
    settings.height
  )
}

export async function imageSize(file: File) {
  const source = await load(file)
  try {
    return { width: source.width, height: source.height }
  } finally {
    close(source)
  }
}

function alphaSample(source: ImageData, width: number, height: number) {
  const output = new ImageData(width, height)
  const area = SAMPLE * SAMPLE
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let alpha = 0
      let red = 0
      let green = 0
      let blue = 0
      for (let sy = 0; sy < SAMPLE; sy++) {
        for (let sx = 0; sx < SAMPLE; sx++) {
          const sourceX = x * SAMPLE + sx
          const sourceY = y * SAMPLE + sy
          const offset = (sourceY * source.width + sourceX) * 4
          const weight = source.data[offset + 3] / 255
          alpha += weight
          red += source.data[offset] * weight
          green += source.data[offset + 1] * weight
          blue += source.data[offset + 2] * weight
        }
      }
      const target = (y * width + x) * 4
      if (alpha > 0) {
        output.data[target] = Math.round(red / alpha)
        output.data[target + 1] = Math.round(green / alpha)
        output.data[target + 2] = Math.round(blue / alpha)
      }
      output.data[target + 3] = Math.round((alpha / area) * 255)
    }
  }
  return output
}

async function load(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch {
      // Chromium does not consistently decode SVG blobs through ImageBitmap.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = "async"
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

function close(source: ImageBitmap | HTMLImageElement) {
  if ("close" in source) source.close()
}
