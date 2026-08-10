import type * as Ort from "onnxruntime-web"

export interface SubjectMask {
  width: number
  height: number
  data: Float32Array
}

const INPUT_SIZE = 320
let sessionPromise: Promise<Ort.InferenceSession> | null = null

export async function segmentSubject(file: File): Promise<SubjectMask> {
  const [session, source] = await Promise.all([getSession(), loadSource(file)])
  try {
    const canvas = document.createElement("canvas")
    canvas.width = INPUT_SIZE
    canvas.height = INPUT_SIZE
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) throw new Error("当前浏览器无法创建主体识别画布")
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(source, 0, 0, INPUT_SIZE, INPUT_SIZE)

    const pixels = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data
    const input = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE)
    const area = INPUT_SIZE * INPUT_SIZE
    const mean = [0.485, 0.456, 0.406]
    const deviation = [0.229, 0.224, 0.225]
    for (let index = 0; index < area; index++) {
      const pixel = index * 4
      input[index] = (pixels[pixel] / 255 - mean[0]) / deviation[0]
      input[area + index] = (pixels[pixel + 1] / 255 - mean[1]) / deviation[1]
      input[area * 2 + index] =
        (pixels[pixel + 2] / 255 - mean[2]) / deviation[2]
    }

    const ort = await import("onnxruntime-web")
    const tensor = new ort.Tensor("float32", input, [
      1,
      3,
      INPUT_SIZE,
      INPUT_SIZE,
    ])
    const result = await session.run({ [session.inputNames[0]]: tensor })
    const output = result[session.outputNames[0]]
    if (!output || !(output.data instanceof Float32Array)) {
      throw new Error("主体识别模型返回了无法读取的结果")
    }
    return {
      width: INPUT_SIZE,
      height: INPUT_SIZE,
      data: normalizeMask(output.data),
    }
  } finally {
    if ("close" in source) source.close()
  }
}

export function normalizeMask(values: Float32Array) {
  let minimum = Number.POSITIVE_INFINITY
  let maximum = Number.NEGATIVE_INFINITY
  for (const value of values) {
    minimum = Math.min(minimum, value)
    maximum = Math.max(maximum, value)
  }
  const range = maximum - minimum
  const output = new Float32Array(values.length)
  if (!Number.isFinite(range) || range <= 0) return output
  for (let index = 0; index < values.length; index++) {
    output[index] = (values[index] - minimum) / range
  }
  return output
}

export function matteAlpha(value: number, thresholdPercent: number) {
  const threshold = Math.max(0, Math.min(1, thresholdPercent / 100))
  const feather = 0.08
  const start = threshold - feather
  const end = threshold + feather
  if (value <= start) return 0
  if (value >= end) return 1
  const progress = (value - start) / (end - start)
  return progress * progress * (3 - 2 * progress)
}

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = createSession().catch((error) => {
      sessionPromise = null
      throw error
    })
  }
  return sessionPromise
}

async function createSession() {
  const ort = await import("onnxruntime-web")
  // One WASM thread keeps the optional feature usable on mobile pages that do
  // not opt into cross-origin isolation and avoids competing with the editor worker.
  ort.env.wasm.numThreads = 1
  const modelUrl = new URL("/models/u2netp.onnx", window.location.origin).href
  try {
    return await ort.InferenceSession.create(modelUrl, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    })
  } catch {
    throw new Error("主体识别模型加载失败，请检查网络后重试")
  }
}

async function loadSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch {
      // Fall back to an image element for older mobile browser decoders.
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
