"use client"

import * as React from "react"
import {
  ArrowDown01Icon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  Loading03Icon,
  RotateClockwiseIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  brands,
  currentMardTier,
  getBrand,
  getBrandPalettes,
  getPalette,
  mardTiers,
  resolveMardTier,
  type MardTier,
} from "@/data/palettes"
import type { BrandId, PaletteId } from "@/types/bead"
import type { Settings as Values } from "@/types/pattern"

interface Props {
  value: Values
  name: string
  sourceMode: "image" | "blank"
  loading: boolean
  canGenerate: boolean
  onChange: (value: Values) => void
  onNameChange: (name: string) => void
  onGenerate: () => void
}

export function Settings({
  value,
  name,
  sourceMode,
  loading,
  canGenerate,
  onChange,
  onNameChange,
  onGenerate,
}: Props) {
  const [advanced, setAdvanced] = React.useState(false)
  const nameId = React.useId()
  const subjectOnlyId = React.useId()
  const subjectAutoFitId = React.useId()
  const patch = (next: Partial<Values>) => onChange({ ...value, ...next })
  const slider = (next: number | readonly number[]) =>
    Array.isArray(next) ? next[0] : next
  const selectedPalette = getPalette(value.palette)
  const selectedBrand = getBrand(value.palette)
  const brandPalettes = getBrandPalettes(selectedBrand.id)
  const maximumColors = selectedPalette.colors.filter(
    (color) => color.auto
  ).length

  const selectBrand = (brandId: BrandId) => {
    const brand = brands.find((item) => item.id === brandId)
    if (!brand) return
    if (brandId === "mard") {
      patch({ palette: "mard-221", maxColors: 221 })
      return
    }
    const palette = getPalette(brand.defaultPalette)
    patch({
      palette: palette.id,
      maxColors: Math.min(value.maxColors, palette.colors.length),
    })
  }

  const selectPalette = (paletteId: PaletteId) => {
    const palette = getPalette(paletteId)
    patch({
      palette: paletteId,
      maxColors: Math.min(value.maxColors, palette.colors.length),
    })
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={nameId}>项目名称</FieldLabel>
          <Input
            id={nameId}
            value={name}
            maxLength={80}
            onChange={(event) => onNameChange(event.target.value)}
          />
          <FieldDescription>修改后自动保存在当前浏览器。</FieldDescription>
        </Field>
      </FieldGroup>

      <Separator />

      <Button size="lg" disabled={!canGenerate || loading} onClick={onGenerate}>
        {loading && (
          <HugeiconsIcon
            icon={Loading03Icon}
            strokeWidth={2}
            data-icon="inline-start"
            className="animate-spin"
          />
        )}
        {loading
          ? "正在生成…"
          : sourceMode === "image"
            ? "应用生成设置"
            : "应用图纸设置"}
      </Button>

      <p className="text-xs font-medium">生成设置</p>

      <FieldGroup>
        <Field>
          <FieldLabel>常用尺寸</FieldLabel>
          <ToggleGroup
            value={[String(value.width)]}
            onValueChange={(items) => {
              const size = Number(items[0])
              if (size) patch({ width: size, height: size })
            }}
            variant="outline"
            spacing={1}
            className="grid w-full grid-cols-3"
          >
            {[29, 58, 87].map((size) => (
              <ToggleGroupItem key={size} value={String(size)}>
                {size} 格
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldDescription>29 格对应一块常见标准拼板。</FieldDescription>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="grid-width">宽度</FieldLabel>
            <Input
              id="grid-width"
              type="number"
              min={10}
              max={200}
              value={value.width}
              onChange={(event) => {
                const width = clamp(Number(event.target.value), 10, 200)
                patch(value.lockRatio ? { width, height: width } : { width })
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="grid-height">高度</FieldLabel>
            <Input
              id="grid-height"
              type="number"
              min={10}
              max={200}
              value={value.height}
              disabled={value.lockRatio}
              onChange={(event) =>
                patch({ height: clamp(Number(event.target.value), 10, 200) })
              }
            />
          </Field>
        </div>
        <Field orientation="horizontal">
          <FieldTitle>锁定宽高比例</FieldTitle>
          <Switch
            checked={value.lockRatio}
            onCheckedChange={(checked) => patch({ lockRatio: checked })}
          />
        </Field>

        <Field>
          <FieldLabel>拼豆品牌</FieldLabel>
          <Select
            items={brands.map((brand) => ({
              label: brand.label,
              value: brand.id,
            }))}
            value={selectedBrand.id}
            onValueChange={(next) => next && selectBrand(next as BrandId)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {brandPalettes.length > 1 &&
          (selectedBrand.id !== "mard" || sourceMode === "blank") && (
            <Field>
              <FieldLabel>品牌系列</FieldLabel>
              <Select
                items={brandPalettes.map((palette) => ({
                  label: palette.name,
                  value: palette.id,
                }))}
                value={value.palette}
                onValueChange={(next) =>
                  next && selectPalette(next as PaletteId)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {brandPalettes.map((palette) => (
                      <SelectItem key={palette.id} value={palette.id}>
                        {palette.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}

        {sourceMode === "image" &&
          (selectedBrand.id === "mard" ? (
            <Field>
              <FieldLabel>MARD 分类</FieldLabel>
              <Select
                items={mardTiers.map((tier) => ({
                  label:
                    tier === 291 ? "所有 MARD 颜色（291）" : `${tier} 色号`,
                  value: String(tier),
                }))}
                value={String(currentMardTier(value.palette, value.maxColors))}
                onValueChange={(next) => {
                  if (!next) return
                  patch(resolveMardTier(Number(next) as MardTier))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {mardTiers.map((tier) => (
                      <SelectItem key={tier} value={String(tier)}>
                        {tier === 291
                          ? "所有 MARD 颜色（291）"
                          : `${tier} 色号`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                24–144 色会从标准 221 色中自动挑选最适合当前图片的颜色。
              </FieldDescription>
            </Field>
          ) : (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>最多颜色</FieldLabel>
                <span className="font-mono text-xs text-muted-foreground">
                  {value.maxColors}
                </span>
              </div>
              <Slider
                min={2}
                max={maximumColors}
                step={1}
                value={[Math.min(value.maxColors, maximumColors)]}
                onValueChange={(next) => patch({ maxColors: slider(next) })}
              />
            </Field>
          ))}

      </FieldGroup>

      {sourceMode === "image" && (
        <>
          <Separator />

          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor={subjectOnlyId}>仅保留图片主体</FieldLabel>
                <FieldDescription>
                  自动识别主体并去除背景；AI 在当前设备运行，不上传图片。
                </FieldDescription>
              </FieldContent>
              <Switch
                id={subjectOnlyId}
                checked={value.subjectOnly}
                onCheckedChange={(subjectOnly) =>
                  patch({
                    subjectOnly,
                    removeWhite: subjectOnly ? false : value.removeWhite,
                    scale: subjectOnly
                      ? value.scale
                      : Math.max(100, value.scale),
                  })
                }
              />
            </Field>
            {value.subjectOnly && (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor={subjectAutoFitId}>
                    裁切后自动放大
                  </FieldLabel>
                  <FieldDescription>
                    开启后主体会居中放大到当前宽高；关闭后保留当前大小，只裁掉外围空白，图纸宽高自动缩小。
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id={subjectAutoFitId}
                  checked={value.subjectAutoFit}
                  onCheckedChange={(subjectAutoFit) =>
                    patch({ subjectAutoFit })
                  }
                />
              </Field>
            )}
          </FieldGroup>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">图片方向</span>
              <span className="font-mono text-xs text-muted-foreground">
                {value.rotation}°
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  patch({
                    rotation: ((value.rotation + 90) %
                      360) as Values["rotation"],
                  })
                }
              >
                <HugeiconsIcon icon={RotateClockwiseIcon} strokeWidth={2} />
                旋转
              </Button>
              <Button
                variant={value.flipX ? "secondary" : "outline"}
                onClick={() => patch({ flipX: !value.flipX })}
              >
                <HugeiconsIcon icon={FlipHorizontalIcon} strokeWidth={2} />
                水平
              </Button>
              <Button
                variant={value.flipY ? "secondary" : "outline"}
                onClick={() => patch({ flipY: !value.flipY })}
              >
                <HugeiconsIcon icon={FlipVerticalIcon} strokeWidth={2} />
                垂直
              </Button>
            </div>
          </div>

          <Collapsible open={advanced} onOpenChange={setAdvanced}>
            <CollapsibleTrigger
              render={
                <Button variant="ghost" className="w-full justify-between" />
              }
            >
              高级设置
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <FieldGroup>
                <Adjust
                  label="缩放"
                  value={value.scale}
                  min={value.subjectOnly ? 50 : 100}
                  max={220}
                  onChange={(scale) => patch({ scale })}
                />
                <Adjust
                  label="水平位置"
                  value={value.offsetX}
                  min={-100}
                  max={100}
                  onChange={(offsetX) => patch({ offsetX })}
                />
                <Adjust
                  label="垂直位置"
                  value={value.offsetY}
                  min={-100}
                  max={100}
                  onChange={(offsetY) => patch({ offsetY })}
                />
                <Adjust
                  label="亮度"
                  value={value.brightness}
                  min={50}
                  max={150}
                  onChange={(brightness) => patch({ brightness })}
                />
                <Adjust
                  label="对比度"
                  value={value.contrast}
                  min={50}
                  max={150}
                  onChange={(contrast) => patch({ contrast })}
                />
                <Adjust
                  label="饱和度"
                  value={value.saturation}
                  min={0}
                  max={180}
                  onChange={(saturation) => patch({ saturation })}
                />
                <Field orientation="horizontal">
                  <FieldTitle>照片抖动</FieldTitle>
                  <Switch
                    checked={value.dither}
                    onCheckedChange={(dither) => patch({ dither })}
                  />
                </Field>
                {value.subjectOnly && (
                  <Adjust
                    label="主体边缘"
                    value={value.subjectThreshold}
                    min={10}
                    max={90}
                    onChange={(subjectThreshold) => patch({ subjectThreshold })}
                  />
                )}
                <Field
                  orientation="horizontal"
                  data-disabled={value.subjectOnly}
                >
                  <FieldTitle>取色去背景</FieldTitle>
                  <Switch
                    checked={value.removeWhite}
                    disabled={value.subjectOnly}
                    onCheckedChange={(removeWhite) => patch({ removeWhite })}
                  />
                </Field>
                {value.removeWhite && (
                  <>
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="background-color">
                          背景颜色
                        </FieldLabel>
                        <span className="font-mono text-xs text-muted-foreground">
                          {value.background}
                        </span>
                      </div>
                      <Input
                        id="background-color"
                        type="color"
                        value={value.background}
                        onChange={(event) =>
                          patch({
                            background:
                              event.target.value.toUpperCase() as `#${string}`,
                          })
                        }
                        className="h-9 w-full"
                      />
                    </Field>
                    <Adjust
                      label="背景容差"
                      value={value.tolerance}
                      min={0}
                      max={100}
                      onChange={(tolerance) => patch({ tolerance })}
                    />
                  </>
                )}
                <Adjust
                  label="透明阈值"
                  value={value.alpha}
                  min={0}
                  max={255}
                  onChange={(alpha) => patch({ alpha })}
                />
              </FieldGroup>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        色卡为屏幕近似值，实际制作前请与实物豆色核对。
      </p>
    </div>
  )
}

function Adjust({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </Field>
  )
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value || min))
