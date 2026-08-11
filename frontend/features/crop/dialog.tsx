"use client"

import * as React from "react"
import {
  AiEraserIcon,
  AiImageIcon,
  AiMagicIcon,
  Loading03Icon,
  RotateClockwiseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Cropper, { type Area, type MediaSize, type Point } from "react-easy-crop"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { generateIllustration } from "@/lib/ai/client"
import { cropFile } from "@/lib/crop"
import { cn } from "@/lib/utils"
import { extractSubject, segmentSubject } from "@/lib/subject"

type Ratio = "source" | "1:1" | "4:3" | "16:9"
type Processing = "applying" | "background" | "illustration" | null

interface Source {
  file: File
  url: string
  pixelArt?: boolean
}

interface ProcessedSource extends Source {
  pixelArt: boolean
}

interface Props {
  open: boolean
  source: Source | null
  size: { width: number; height: number }
  onOpen: (open: boolean) => void
  onApply: (
    file: File,
    size: { width: number; height: number },
    options?: { pixelArt?: boolean }
  ) => void
}

export function CropDialog({ open, source, size, onOpen, onApply }: Props) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [ratio, setRatio] = React.useState<Ratio>("source")
  const [media, setMedia] = React.useState<MediaSize | null>(null)
  const [area, setArea] = React.useState<Area | null>(null)
  const [width, setWidth] = React.useState(size.width)
  const [removeBackground, setRemoveBackground] = React.useState(false)
  const [illustrationEnabled, setIllustrationEnabled] = React.useState(false)
  const [effect, setEffect] = React.useState("")
  const [illustration, setIllustration] =
    React.useState<ProcessedSource | null>(null)
  const [cutout, setCutout] = React.useState<{
    source: File
    preview: ProcessedSource
  } | null>(null)
  const [processing, setProcessing] = React.useState<Processing>(null)
  const createdUrls = React.useRef(new Set<string>())
  const backgroundCache = React.useRef(new Map<File, ProcessedSource>())
  const backgroundRequest = React.useRef(0)
  const illustrationRequest = React.useRef(0)
  const aiAbort = React.useRef<AbortController | null>(null)
  const removeBackgroundRef = React.useRef(false)

  const baseSource = illustrationEnabled && illustration ? illustration : source
  const preview =
    removeBackground && cutout && cutout.source === baseSource?.file
      ? cutout.preview
      : baseSource
  const sourceRatio = media
    ? media.naturalWidth / media.naturalHeight
    : size.width / size.height
  const aspect = ratioValue(ratio, sourceRatio)
  const height = Math.max(10, Math.min(200, Math.round(width / aspect)))
  const busy = processing !== null

  React.useEffect(() => {
    const urls = createdUrls.current
    return () => {
      aiAbort.current?.abort()
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const resetTransform = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setArea(null)
  }

  const createPreview = (file: File, pixelArt: boolean) => {
    const url = URL.createObjectURL(file)
    createdUrls.current.add(url)
    return { file, url, pixelArt }
  }

  const createCutout = async (target: Source) => {
    const cached = backgroundCache.current.get(target.file)
    if (cached) return cached
    const mask = await segmentSubject(target.file)
    const file = await extractSubject(target.file, mask)
    const result = createPreview(file, target.pixelArt ?? false)
    backgroundCache.current.set(target.file, result)
    await preloadImage(result.url)
    return result
  }

  const prepareBackground = async (target: Source) => {
    const requestId = ++backgroundRequest.current
    setProcessing("background")
    try {
      const result = await createCutout(target)
      if (requestId !== backgroundRequest.current) return
      setCutout({ source: target.file, preview: result })
      resetTransform()
    } catch (error) {
      if (requestId !== backgroundRequest.current) return
      removeBackgroundRef.current = false
      setRemoveBackground(false)
      toast.error(error instanceof Error ? error.message : "背景移除失败")
    } finally {
      if (requestId === backgroundRequest.current) setProcessing(null)
    }
  }

  const changeBackground = (enabled: boolean) => {
    if (!baseSource) return
    removeBackgroundRef.current = enabled
    setRemoveBackground(enabled)
    if (!enabled) {
      backgroundRequest.current++
      setProcessing(null)
      setCutout(null)
      resetTransform()
      return
    }
    void prepareBackground(baseSource)
  }

  const changeIllustration = (enabled: boolean) => {
    setIllustrationEnabled(enabled)
    const target = enabled && illustration ? illustration : source
    if (removeBackground && target) void prepareBackground(target)
    else setCutout(null)
    resetTransform()
  }

  const generateAiPreview = async () => {
    if (!source || !preview || !area || busy) return
    aiAbort.current?.abort()
    const controller = new AbortController()
    aiAbort.current = controller
    const requestId = ++illustrationRequest.current
    setProcessing("illustration")
    try {
      const input = await cropFile(
        preview.url,
        source.file.name,
        area,
        rotation,
        preview.pixelArt
      )
      const generated = await generateIllustration(input, {
        targetSize: Math.max(width, height),
        effect,
        signal: controller.signal,
      })
      if (requestId !== illustrationRequest.current) return
      const generatedPreview = createPreview(generated, true)
      await preloadImage(generatedPreview.url)

      let generatedCutout: ProcessedSource | null = null
      if (removeBackgroundRef.current) {
        setProcessing("background")
        try {
          generatedCutout = await createCutout(generatedPreview)
        } catch (error) {
          removeBackgroundRef.current = false
          setRemoveBackground(false)
          toast.error(
            error instanceof Error
              ? `Q 版已生成，${error.message}`
              : "Q 版已生成，但背景移除失败"
          )
        }
      }
      if (requestId !== illustrationRequest.current) return
      setIllustration(generatedPreview)
      setIllustrationEnabled(true)
      setCutout(
        generatedCutout
          ? { source: generatedPreview.file, preview: generatedCutout }
          : null
      )
      resetTransform()
      await wait(420)
    } catch (error) {
      if (controller.signal.aborted) return
      toast.error(error instanceof Error ? error.message : "Q 版插图生成失败")
    } finally {
      if (requestId === illustrationRequest.current) setProcessing(null)
      if (aiAbort.current === controller) aiAbort.current = null
    }
  }

  const apply = async () => {
    if (!source || !preview || !area || busy) return
    setProcessing("applying")
    try {
      const file = await cropFile(
        preview.url,
        source.file.name,
        area,
        rotation,
        preview.pixelArt
      )
      onApply(file, { width, height }, { pixelArt: preview.pixelArt })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "裁剪图片失败")
      setProcessing(null)
    }
  }

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(next) => {
        if (!next && busy) return
        onOpen(next)
      }}
    >
      <DialogContent className="grid h-[min(860px,calc(100dvh-2rem))] animate-none! grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-2rem)] xl:max-w-6xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-lg">裁剪与处理</DialogTitle>
          <DialogDescription className="sr-only">
            裁剪图片，并选择背景移除或 Q 版插图效果。
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 grid-rows-[minmax(300px,1fr)_minmax(260px,0.8fr)] md:grid-cols-[minmax(0,1fr)_336px] md:grid-rows-1">
          <section className="flex min-h-0 min-w-0 flex-col gap-3 bg-muted/25 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">拖动裁剪</p>
              <Badge variant="outline" className="font-mono">
                {Math.round(zoom * 100)}%
              </Badge>
            </div>
            <div
              className={cn(
                "crop-preview-shell relative min-h-0 flex-1 overflow-hidden rounded-lg border",
                busy && "pointer-events-none"
              )}
              aria-busy={busy}
            >
              {preview && (
                <Cropper
                  image={preview.url}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  objectFit="contain"
                  minZoom={1}
                  maxZoom={5}
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onMediaLoaded={setMedia}
                  onCropComplete={(_, pixels) => setArea(pixels)}
                  style={{
                    mediaStyle: {
                      imageRendering: preview.pixelArt ? "pixelated" : "auto",
                    },
                  }}
                />
              )}
              {busy && <GenerationOverlay processing={processing} />}
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto border-t bg-background p-5 md:border-t-0 md:border-l">
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="remove-background">
                    <HugeiconsIcon icon={AiEraserIcon} strokeWidth={2} />
                    AI 背景移除
                  </FieldLabel>
                </FieldContent>
                <Switch
                  id="remove-background"
                  checked={removeBackground}
                  disabled={busy}
                  onCheckedChange={changeBackground}
                />
              </Field>

              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="chibi-illustration">
                    <HugeiconsIcon icon={AiImageIcon} strokeWidth={2} />Q 版插图
                  </FieldLabel>
                </FieldContent>
                <Switch
                  id="chibi-illustration"
                  checked={illustrationEnabled}
                  disabled={busy}
                  onCheckedChange={changeIllustration}
                />
              </Field>

              {illustrationEnabled && (
                <Field>
                  <FieldLabel htmlFor="illustration-effect" className="sr-only">
                    自定义 Q 版效果
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="illustration-effect"
                      value={effect}
                      maxLength={200}
                      disabled={busy}
                      placeholder="自定义效果（可选）"
                      onChange={(event) => setEffect(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void generateAiPreview()
                      }}
                    />
                    <Button
                      size="sm"
                      disabled={busy || !area}
                      onClick={() => void generateAiPreview()}
                    >
                      <HugeiconsIcon
                        icon={AiMagicIcon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      {illustration ? "重绘" : "生成"}
                    </Button>
                  </div>
                </Field>
              )}

              <Separator />

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldTitle>图纸宽度</FieldTitle>
                  <span className="font-mono text-xs">
                    {width} × {height} 格
                  </span>
                </div>
                <Slider
                  min={10}
                  max={200}
                  step={1}
                  value={[width]}
                  aria-label="图纸宽度"
                  onValueChange={(next) =>
                    setWidth(Array.isArray(next) ? next[0] : next)
                  }
                />
              </Field>

              <Field>
                <FieldTitle>裁剪比例</FieldTitle>
                <ToggleGroup
                  value={[ratio]}
                  onValueChange={(items) =>
                    items[0] && setRatio(items[0] as Ratio)
                  }
                  variant="outline"
                  spacing={1}
                  className="grid w-full grid-cols-4"
                >
                  <ToggleGroupItem value="source">原图</ToggleGroupItem>
                  <ToggleGroupItem value="1:1">1:1</ToggleGroupItem>
                  <ToggleGroupItem value="4:3">4:3</ToggleGroupItem>
                  <ToggleGroupItem value="16:9">16:9</ToggleGroupItem>
                </ToggleGroup>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldTitle>旋转</FieldTitle>
                  <span className="font-mono text-xs">{rotation}°</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setRotation((value) => (value + 90) % 360)}
                >
                  <HugeiconsIcon
                    icon={RotateClockwiseIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  旋转 90°
                </Button>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldTitle>缩放</FieldTitle>
                  <span className="font-mono text-xs">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={0.01}
                  value={[zoom]}
                  aria-label="图片缩放"
                  onValueChange={(next) =>
                    setZoom(Array.isArray(next) ? next[0] : next)
                  }
                />
              </Field>
            </FieldGroup>
          </aside>
        </div>

        <DialogFooter className="border-t bg-background px-6 py-4">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onOpen(false)}
          >
            取消
          </Button>
          <Button
            disabled={busy || !area || (illustrationEnabled && !illustration)}
            onClick={() => void apply()}
          >
            {busy && (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                data-icon="inline-start"
                className="animate-spin"
              />
            )}
            生成拼豆图
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GenerationOverlay({ processing }: { processing: Processing }) {
  return (
    <div
      className="ai-preview-loading absolute inset-0 flex items-center justify-center overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm">
        <HugeiconsIcon
          icon={
            processing === "illustration"
              ? AiMagicIcon
              : processing === "background"
                ? AiEraserIcon
                : AiImageIcon
          }
          strokeWidth={2}
          className="ai-preview-status-icon text-primary"
        />
        <span className="text-sm font-medium">
          {processing === "illustration"
            ? "正在生成 Q 版"
            : processing === "background"
              ? "正在移除背景"
              : "正在生成拼豆图"}
        </span>
      </div>
    </div>
  )
}

function ratioValue(ratio: Ratio, source: number) {
  if (ratio === "1:1") return 1
  if (ratio === "4:3") return 4 / 3
  if (ratio === "16:9") return 16 / 9
  return source || 1
}

function preloadImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => reject(new Error("无法读取处理后的图片"))
    image.src = url
  })
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) =>
    window.setTimeout(resolve, milliseconds)
  )
}
