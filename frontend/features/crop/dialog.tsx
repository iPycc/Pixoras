"use client"

import * as React from "react"
import {
  GridIcon,
  Image01Icon,
  Loading03Icon,
  RotateClockwiseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Cropper, { type Area, type MediaSize, type Point } from "react-easy-crop"
import { toast } from "sonner"

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
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cropFile } from "@/lib/crop"

type Ratio = "source" | "1:1" | "4:3" | "16:9"

interface Source {
  file: File
  url: string
  pixelArt?: boolean
}

interface Props {
  open: boolean
  source: Source | null
  size: { width: number; height: number }
  onOpen: (open: boolean) => void
  onApply: (file: File, size: { width: number; height: number }) => void
}

export function CropDialog({ open, source, size, onOpen, onApply }: Props) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [ratio, setRatio] = React.useState<Ratio>("source")
  const [media, setMedia] = React.useState<MediaSize | null>(null)
  const [area, setArea] = React.useState<Area | null>(null)
  const [width, setWidth] = React.useState(size.width)
  const [view, setView] = React.useState<"photo" | "pixel">("photo")
  const [busy, setBusy] = React.useState(false)

  const sourceRatio = media
    ? media.naturalWidth / media.naturalHeight
    : size.width / size.height
  const aspect = ratioValue(ratio, sourceRatio)
  const height = Math.max(10, Math.min(200, Math.round(width / aspect)))

  const apply = async () => {
    if (!source || !area) return
    setBusy(true)
    try {
      const file = await cropFile(
        source.url,
        source.file.name,
        area,
        rotation,
        source.pixelArt
      )
      onApply(file, { width, height })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "裁剪图片失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpen}>
      <DialogContent className="grid h-[min(860px,calc(100dvh-2rem))] animate-none! grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-2rem)] xl:max-w-6xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-xl">裁剪图片</DialogTitle>
          <DialogDescription>
            移动图片并选择保留范围，图纸尺寸和预览会同步更新。
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 grid-rows-[minmax(220px,1fr)_minmax(220px,1fr)] bg-muted/25 md:grid-cols-[minmax(0,1fr)_320px] md:grid-rows-1">
          <section className="flex min-h-[220px] min-w-0 flex-col gap-3 p-4 sm:p-6 md:min-h-[360px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">实时预览</p>
                <p className="text-xs text-muted-foreground">
                  拖动图片选择画面，滚轮或双指调整大小。
                </p>
              </div>
              <span className="rounded-md border bg-background px-2 py-1 font-mono text-xs">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted/40">
              {source && (
                <Cropper
                  image={source.url}
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
                      imageRendering:
                        source.pixelArt || view === "pixel"
                          ? "pixelated"
                          : "auto",
                    },
                  }}
                />
              )}
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto border-t bg-background p-5 md:border-t-0 md:border-l">
            <FieldGroup>
              <Field>
                <FieldTitle>预览方式</FieldTitle>
                <ToggleGroup
                  value={[view]}
                  onValueChange={(items) =>
                    items[0] && setView(items[0] as typeof view)
                  }
                  variant="outline"
                  spacing={1}
                  className="grid w-full grid-cols-2"
                >
                  <ToggleGroupItem value="photo">
                    <HugeiconsIcon
                      icon={Image01Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    原图
                  </ToggleGroupItem>
                  <ToggleGroupItem value="pixel">
                    <HugeiconsIcon
                      icon={GridIcon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    像素预览
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>

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
                  onValueChange={(next) =>
                    setWidth(Array.isArray(next) ? next[0] : next)
                  }
                />
                <FieldDescription>
                  高度按裁剪比例自动计算，范围限制为 10–200 格。
                </FieldDescription>
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
                  variant="outline"
                  onClick={() => setRotation((value) => (value + 90) % 360)}
                >
                  <HugeiconsIcon
                    icon={RotateClockwiseIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  顺时针旋转 90°
                </Button>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldTitle>图片缩放</FieldTitle>
                  <span className="font-mono text-xs">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={0.01}
                  value={[zoom]}
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
          <Button disabled={busy || !area} onClick={apply}>
            {busy && (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                data-icon="inline-start"
                className="animate-spin"
              />
            )}
            按裁剪生成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ratioValue(ratio: Ratio, source: number) {
  if (ratio === "1:1") return 1
  if (ratio === "4:3") return 4 / 3
  if (ratio === "16:9") return 16 / 9
  return source || 1
}
