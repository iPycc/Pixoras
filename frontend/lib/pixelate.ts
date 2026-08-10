export const DEFAULT_PIXEL_STRENGTH = 1
export const MIN_PIXEL_STRENGTH = 1
export const MAX_PIXEL_STRENGTH = 10

const BLOCK_SIZES = [1, 2, 4, 8, 12, 16, 24, 32, 48, 64] as const

export function pixelBlockSize(strength: number) {
  const value = Math.max(
    MIN_PIXEL_STRENGTH,
    Math.min(MAX_PIXEL_STRENGTH, Math.round(strength))
  )
  return BLOCK_SIZES[value - 1]
}

export function pixelGridSize(width: number, height: number, strength: number) {
  const block = pixelBlockSize(strength)
  return {
    width: Math.max(1, Math.ceil(width / block)),
    height: Math.max(1, Math.ceil(height / block)),
  }
}

export function drawPixelated(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvas: HTMLCanvasElement,
  strength: number,
  maxPreviewEdge = Number.POSITIVE_INFINITY
) {
  const grid = pixelGridSize(sourceWidth, sourceHeight, strength)
  const scale = Math.min(
    1,
    maxPreviewEdge / Math.max(sourceWidth, sourceHeight)
  )
  const outputWidth = Math.max(1, Math.round(sourceWidth * scale))
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale))
  const reduced = document.createElement("canvas")
  reduced.width = grid.width
  reduced.height = grid.height
  const reducedContext = reduced.getContext("2d", { alpha: true })
  const context = canvas.getContext("2d", { alpha: true })
  if (!reducedContext || !context) throw new Error("浏览器不支持像素画处理")

  reducedContext.clearRect(0, 0, grid.width, grid.height)
  reducedContext.imageSmoothingEnabled = true
  reducedContext.imageSmoothingQuality = "high"
  reducedContext.drawImage(source, 0, 0, grid.width, grid.height)

  canvas.width = outputWidth
  canvas.height = outputHeight
  context.clearRect(0, 0, outputWidth, outputHeight)
  context.imageSmoothingEnabled = false
  context.drawImage(reduced, 0, 0, outputWidth, outputHeight)
}

export function clearConnectedWhiteBackground(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance = 30
) {
  if (width <= 0 || height <= 0 || pixels.length < width * height * 4) return
  const visited = new Uint8Array(width * height)
  const queue = new Uint32Array(width * height)
  let head = 0
  let tail = 0
  const maximumDistance = Math.max(0, tolerance) ** 2

  const isBackground = (index: number) => {
    const offset = index * 4
    if (pixels[offset + 3] === 0) return true
    const red = 255 - pixels[offset]
    const green = 255 - pixels[offset + 1]
    const blue = 255 - pixels[offset + 2]
    return red * red + green * green + blue * blue <= maximumDistance
  }
  const enqueue = (index: number) => {
    if (visited[index] || !isBackground(index)) return
    visited[index] = 1
    queue[tail++] = index
  }

  for (let x = 0; x < width; x++) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (head < tail) {
    const index = queue[head++]
    pixels[index * 4 + 3] = 0
    const x = index % width
    const y = Math.floor(index / width)
    if (x > 0) enqueue(index - 1)
    if (x + 1 < width) enqueue(index + 1)
    if (y > 0) enqueue(index - width)
    if (y + 1 < height) enqueue(index + width)
  }
}

export function drawSubjectPixelated(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvas: HTMLCanvasElement,
  strength: number,
  maxPreviewEdge = Number.POSITIVE_INFINITY
) {
  const cutout = document.createElement("canvas")
  cutout.width = sourceWidth
  cutout.height = sourceHeight
  const context = cutout.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("浏览器不支持背景移除")
  context.drawImage(source, 0, 0, sourceWidth, sourceHeight)
  const image = context.getImageData(0, 0, sourceWidth, sourceHeight)
  clearConnectedWhiteBackground(image.data, sourceWidth, sourceHeight)
  context.putImageData(image, 0, 0)
  drawPixelated(
    cutout,
    sourceWidth,
    sourceHeight,
    canvas,
    strength,
    maxPreviewEdge
  )
}

export async function pixelateFile(file: File, strength: number) {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement("canvas")
    drawSubjectPixelated(bitmap, bitmap.width, bitmap.height, canvas, strength)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("无法生成像素画图片")),
        "image/png"
      )
    )
    const base = file.name.replace(/\.[^.]+$/, "") || "图片"
    return new File([blob], `${base}-pixel.png`, { type: "image/png" })
  } finally {
    bitmap.close()
  }
}
