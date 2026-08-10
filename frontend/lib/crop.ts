export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export async function cropFile(
  source: string,
  sourceName: string,
  area: CropArea,
  rotation: number,
  pixelArt = false
) {
  const image = await loadImage(source)
  const radians = (rotation * Math.PI) / 180
  const bounds = rotatedSize(image.naturalWidth, image.naturalHeight, radians)
  const stage = document.createElement("canvas")
  stage.width = Math.ceil(bounds.width)
  stage.height = Math.ceil(bounds.height)
  const context = stage.getContext("2d")
  if (!context) throw new Error("无法创建裁剪画布")
  context.imageSmoothingEnabled = !pixelArt

  context.translate(stage.width / 2, stage.height / 2)
  context.rotate(radians)
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  const output = document.createElement("canvas")
  output.width = Math.max(1, Math.round(area.width))
  output.height = Math.max(1, Math.round(area.height))
  const outputContext = output.getContext("2d")
  if (!outputContext) throw new Error("无法创建裁剪画布")
  outputContext.imageSmoothingEnabled = !pixelArt
  outputContext.drawImage(
    stage,
    Math.round(area.x),
    Math.round(area.y),
    Math.round(area.width),
    Math.round(area.height),
    0,
    0,
    output.width,
    output.height
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    output.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("裁剪图片失败"))),
      "image/png"
    )
  })
  const base = sourceName.replace(/\.[^.]+$/, "") || "图片"
  return new File([blob], `${base}-crop.png`, { type: "image/png" })
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("无法读取图片"))
    image.src = source
  })
}

function rotatedSize(width: number, height: number, radians: number) {
  return {
    width:
      Math.abs(Math.cos(radians) * width) +
      Math.abs(Math.sin(radians) * height),
    height:
      Math.abs(Math.sin(radians) * width) +
      Math.abs(Math.cos(radians) * height),
  }
}
