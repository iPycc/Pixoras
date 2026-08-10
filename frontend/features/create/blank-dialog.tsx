"use client"

import * as React from "react"
import { GridIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

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
  FieldLabel,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { palettes } from "@/data/palettes"
import type { PaletteId } from "@/types/bead"

export interface BlankOptions {
  name: string
  width: number
  height: number
  palette: PaletteId
}

interface Props {
  open: boolean
  onOpen: (open: boolean) => void
  onCreate: (options: BlankOptions) => void
}

const paletteItems = Object.values(palettes).map((palette) => ({
  value: palette.id,
  label: `${palette.name} · ${palette.colors.length} 色`,
}))

export function BlankDialog({ open, onOpen, onCreate }: Props) {
  const [name, setName] = React.useState("未命名空白图纸")
  const [width, setWidth] = React.useState(58)
  const [height, setHeight] = React.useState(58)
  const [palette, setPalette] = React.useState<PaletteId>("perler")

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">新建空白图纸</DialogTitle>
          <DialogDescription>
            先确定画布和实体豆系列，进入编辑器后可逐格绘制。
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel htmlFor="blank-name">图纸名称</FieldLabel>
            <Input
              id="blank-name"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>常用尺寸</FieldLabel>
            <ToggleGroup
              value={width === height ? [String(width)] : []}
              onValueChange={(items) => {
                const size = Number(items[0])
                if (size) {
                  setWidth(size)
                  setHeight(size)
                }
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
            <FieldDescription>29 格约为一块常见标准拼板。</FieldDescription>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="blank-width">宽度</FieldLabel>
              <Input
                id="blank-width"
                type="number"
                min={10}
                max={200}
                value={width}
                onChange={(event) =>
                  setWidth(clamp(Number(event.target.value)))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="blank-height">高度</FieldLabel>
              <Input
                id="blank-height"
                type="number"
                min={10}
                max={200}
                value={height}
                onChange={(event) =>
                  setHeight(clamp(Number(event.target.value)))
                }
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>实体豆系列</FieldLabel>
            <Select
              items={paletteItems}
              value={palette}
              onValueChange={(next) => next && setPalette(next as PaletteId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {paletteItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpen(false)}>
            取消
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() =>
              onCreate({ name: name.trim(), width, height, palette })
            }
          >
            <HugeiconsIcon
              icon={GridIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            创建图纸
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function clamp(value: number) {
  return Math.max(10, Math.min(200, value || 10))
}
