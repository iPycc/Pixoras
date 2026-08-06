import { convert } from "@/lib/pattern/convert"
import type { BeadColor } from "@/types/bead"
import type { Pattern, Settings } from "@/types/pattern"

export async function runWorker(
  image: ImageData,
  colors: BeadColor[],
  settings: Settings
): Promise<Pattern> {
  if (typeof Worker === "undefined") return convert(image, colors, settings)
  try {
    const worker = new Worker(new URL("../workers/convert.worker.ts", import.meta.url))
    const cells = await new Promise<ArrayBuffer>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("转换超时")), 20_000)
      worker.onmessage = (event) => {
        window.clearTimeout(timeout)
        if (event.data.ok) resolve(event.data.cells)
        else reject(new Error(event.data.message))
      }
      worker.onerror = () => reject(new Error("Worker 启动失败"))
      worker.postMessage({ image, colors, settings })
    })
    worker.terminate()
    return {
      width: image.width,
      height: image.height,
      cells: new Uint16Array(cells),
      colors,
    }
  } catch {
    return convert(image, colors, settings)
  }
}
