/// <reference lib="webworker" />

import { convert } from "@/lib/pattern/convert"
import type { BeadColor } from "@/types/bead"
import type { Settings } from "@/types/pattern"

type Request = { image: ImageData; colors: BeadColor[]; settings: Settings }

self.onmessage = (event: MessageEvent<Request>) => {
  try {
    const pattern = convert(event.data.image, event.data.colors, event.data.settings)
    self.postMessage({ ok: true, cells: pattern.cells.buffer }, [pattern.cells.buffer])
  } catch (error) {
    self.postMessage({
      ok: false,
      message: error instanceof Error ? error.message : "转换失败",
    })
  }
}

export {}
