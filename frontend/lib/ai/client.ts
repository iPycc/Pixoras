interface Options {
  targetSize: number
  effect?: string
  signal?: AbortSignal
}

export async function generateIllustration(file: File, options: Options) {
  const form = new FormData()
  form.set("image", file)
  form.set("targetSize", String(options.targetSize))
  const effect = options.effect?.trim()
  if (effect) form.set("effect", effect)

  const configuredBase = process.env.NEXT_PUBLIC_AI_API_BASE?.replace(/\/$/, "")
  const baseUrl =
    configuredBase || `http://${window.location.hostname || "127.0.0.1"}:8000`
  const response = await fetch(`${baseUrl}/api/ai/illustrate`, {
    method: "POST",
    body: form,
    cache: "no-store",
    signal: options.signal,
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(payload?.message || "AI 插画生成失败")
  }
  const blob = await response.blob()
  if (!blob.type.startsWith("image/")) throw new Error("AI 服务返回了无效图片")
  const base = file.name.replace(/\.[^.]+$/, "") || "图片"
  const extension =
    blob.type === "image/jpeg"
      ? "jpg"
      : blob.type === "image/webp"
        ? "webp"
        : "png"
  return new File([blob], `${base}-ai-pixel.${extension}`, { type: blob.type })
}
