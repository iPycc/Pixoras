"use client"

import * as React from "react"
import {
  CheckmarkCircle02Icon,
  Image01Icon,
  Loading03Icon,
  MagicWand01Icon,
  SecurityLockIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { drawSubjectPixelated, pixelBlockSize } from "@/lib/pixelate"
import type { SubjectAnalysis } from "@/lib/subject"

export interface UploadPreview {
  file: File
  url: string
}

export type UploadStage = "analyzing" | "choice" | "generating" | "result"

interface Props {
  source: UploadPreview | null
  result: UploadPreview | null
  analysis: SubjectAnalysis | null
  stage: UploadStage
  pixelEnabled: boolean
  pixelStrength: number
  error: string
  onPixelEnabled: (enabled: boolean) => void
  onPixelStrength: (strength: number) => void
  onClose: () => void
  onGenerate: () => void
  onUseOriginal: () => void
  onUseResult: () => void
}

export function UploadDialog({
  source,
  result,
  analysis,
  stage,
  pixelEnabled,
  pixelStrength,
  error,
  onPixelEnabled,
  onPixelStrength,
  onClose,
  onGenerate,
  onUseOriginal,
  onUseResult,
}: Props) {
  const busy = stage === "analyzing" || stage === "generating"
  if (!source) return null

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton
        className="grid h-[min(820px,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">图片处理</Badge>
            {analysis && stage !== "analyzing" && (
              <span className="text-xs text-muted-foreground">
                建议 {analysis.recommendedSize} × {analysis.recommendedSize} 格
              </span>
            )}
          </div>
          <DialogTitle className="text-xl">{stageTitle(stage)}</DialogTitle>
          <DialogDescription className="max-w-2xl text-sm leading-6">
            {stageDescription(stage)}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {stage === "result" && result ? (
          <PixelAdjustView
            result={result}
            strength={pixelStrength}
            onStrength={onPixelStrength}
          />
        ) : (
          <div className="grid min-h-0 overflow-y-auto md:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
            <Preview source={source} label="上传图片" />
            <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 md:border-l">
              {busy ? (
                <BusyState key={stage} stage={stage} />
              ) : (
                <PixelChoice
                  analysis={analysis}
                  enabled={pixelEnabled}
                  error={error}
                  onEnabled={onPixelEnabled}
                />
              )}
            </div>
          </div>
        )}

        <Separator />

        <DialogFooter className="px-5 py-4 sm:px-6">
          {stage === "choice" && (
            <>
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={pixelEnabled ? onGenerate : onUseOriginal}>
                <HugeiconsIcon
                  icon={pixelEnabled ? MagicWand01Icon : Image01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                {pixelEnabled ? "AI 生成 Q 版像素角色" : "直接进入拼豆"}
              </Button>
            </>
          )}
          {stage === "result" && (
            <>
              <Button variant="outline" onClick={onGenerate}>
                重新生成
              </Button>
              <Button onClick={onUseResult}>
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                使用 Q 版像素角色进入拼豆
              </Button>
            </>
          )}
          {busy && (
            <Button variant="outline" onClick={onClose}>
              {stage === "generating" ? "取消生成" : "取消处理"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PixelChoice({
  analysis,
  enabled,
  error,
  onEnabled,
}: {
  analysis: SubjectAnalysis | null
  enabled: boolean
  error: string
  onEnabled: (enabled: boolean) => void
}) {
  return (
    <>
      <FieldGroup>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="pixel-enabled">像素化</FieldLabel>
            <FieldDescription>
              打开后先由 AI 清除场景并重画成大头 Q
              版像素角色，再手动调节像素强度。
            </FieldDescription>
          </FieldContent>
          <Switch
            id="pixel-enabled"
            checked={enabled}
            onCheckedChange={onEnabled}
          />
        </Field>
      </FieldGroup>

      <Separator />

      {enabled ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            {analysis?.hasSubject
              ? "已完成主体区域检查"
              : "将由 AI 识别主要主体"}
          </p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {[
              "删除桌椅和环境，让主要人物占满画布",
              "放大头部和五官，多人并排且互不遮挡",
              "生成清晰的 8-bit Q 版像素角色",
              "禁止纹理、噪点、渐变和网格线",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={SecurityLockIcon}
                  strokeWidth={2}
                  className="size-4 shrink-0 text-foreground"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">保持上传图片</p>
          <p className="text-sm leading-6 text-muted-foreground">
            不调用 AI，也不添加像素效果，直接进入裁剪和拼豆转换。
          </p>
        </div>
      )}

      {error && (
        <Field data-invalid>
          <FieldError>{error}</FieldError>
        </Field>
      )}

      <p className="mt-auto text-xs leading-5 text-muted-foreground">
        只有点击“AI 生成 Q
        版像素角色”后图片才会发送至火山引擎；像素强度调整完全在本地运行。
      </p>
    </>
  )
}

function BusyState({ stage }: { stage: UploadStage }) {
  const [elapsed, setElapsed] = React.useState(0)

  React.useEffect(() => {
    if (stage !== "generating") return
    const timer = window.setInterval(
      () => setElapsed((value) => value + 1),
      1_000
    )
    return () => window.clearInterval(timer)
  }, [stage])

  return (
    <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-4 text-center">
      <HugeiconsIcon
        icon={Loading03Icon}
        strokeWidth={2}
        className="size-8 animate-spin text-primary"
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {stage === "analyzing" ? "正在本地检查图片" : "正在生成 Q 版像素角色"}
        </p>
        <p className="max-w-xs text-xs leading-5 text-muted-foreground">
          {stage === "analyzing"
            ? "正在检查主体区域并计算建议拼豆尺寸。"
            : `通常需要 40–90 秒，已等待 ${elapsed} 秒。完成后可手动调整像素强度。`}
        </p>
      </div>
    </div>
  )
}

function PixelAdjustView({
  result,
  strength,
  onStrength,
}: {
  result: UploadPreview
  strength: number
  onStrength: (strength: number) => void
}) {
  const block = pixelBlockSize(strength)
  return (
    <div className="grid min-h-0 overflow-y-auto md:grid-cols-[minmax(0,1fr)_320px]">
      <figure className="flex min-h-72 flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/35 p-4 sm:p-6">
          <div className="flex h-full min-h-64 w-full items-center justify-center overflow-hidden rounded-lg border bg-background">
            <PixelCanvas source={result} strength={strength} />
          </div>
        </div>
        <figcaption className="border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">
          像素画实时预览 · 不添加纹理
        </figcaption>
      </figure>

      <aside className="flex flex-col gap-6 border-t px-5 py-5 sm:px-6 md:border-t-0 md:border-l">
        <FieldGroup>
          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldTitle>像素强度</FieldTitle>
              <span className="font-mono text-xs">
                {strength} · 约 {block}px 方块
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[strength]}
              aria-label="像素强度"
              onValueChange={(value) =>
                onStrength(Array.isArray(value) ? value[0] : value)
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>细腻、逼真</span>
              <span>粗颗粒、模糊</span>
            </div>
            <FieldDescription>
              数值越大，方形像素块越大、细节越少；数值越小，五官和服装细节保留越多。
            </FieldDescription>
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">固定处理规则</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>仅使用方形色块重采样</li>
            <li>图片纹理保持为 0</li>
            <li>不添加抖动、颗粒或扫描线</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

function PixelCanvas({
  source,
  strength,
}: {
  source: UploadPreview
  strength: number
}) {
  const canvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    let active = true
    const image = new Image()
    image.onload = () => {
      if (!active || !canvas.current) return
      drawSubjectPixelated(
        image,
        image.naturalWidth,
        image.naturalHeight,
        canvas.current,
        strength,
        1_100
      )
    }
    image.src = source.url
    return () => {
      active = false
    }
  }, [source.url, strength])

  return (
    <canvas
      ref={canvas}
      aria-label="像素画预览"
      className="max-h-[52dvh] max-w-full [image-rendering:pixelated]"
    />
  )
}

function Preview({ source, label }: { source: UploadPreview; label: string }) {
  return (
    <figure className="flex min-h-72 flex-col">
      <div className="flex-1 bg-muted/35 p-4 sm:p-6">
        <div className="flex h-full min-h-64 items-center justify-center overflow-hidden rounded-lg border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source.url}
            alt={label}
            className="max-h-[52dvh] w-full object-contain"
          />
        </div>
      </div>
      <figcaption className="border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">
        {label}
      </figcaption>
    </figure>
  )
}

function stageTitle(stage: UploadStage) {
  if (stage === "analyzing") return "正在检查这张图片"
  if (stage === "generating") return "AI 正在生成 Q 版像素角色"
  if (stage === "result") return "调整像素强度"
  return "是否先进行像素化？"
}

function stageDescription(stage: UploadStage) {
  if (stage === "analyzing") return "识别主体只在当前设备运行，不会上传图片。"
  if (stage === "generating")
    return "Seedream 正在删除原场景、放大人物与五官，并生成 8-bit Q 版像素角色。"
  if (stage === "result")
    return "拖动滑杆选择细节与像素块大小，确认后会把当前效果送入 Pixoras 生成拼豆。"
  return "像素化默认开启；关闭后将跳过 AI 和像素效果，直接使用上传图片。"
}
