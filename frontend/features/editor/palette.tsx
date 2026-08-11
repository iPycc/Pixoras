"use client"

import * as React from "react"
import { Add01Icon, Exchange01Icon, Search01Icon } from "@hugeicons/core-free-icons"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { InventoryDialog } from "@/features/inventory/dialog"
import { beadColorDetails } from "@/lib/color/label"
import { total, usage } from "@/lib/pattern/edit"
import { cn } from "@/lib/utils"
import type { BeadColor } from "@/types/bead"
import type { Pattern } from "@/types/pattern"

interface Props {
  pattern: Pattern
  selected: number
  onSelect: (index: number) => void
  onHighlight: (index: number | null) => void
  onAdd: (color: BeadColor) => void
  onReplace: (from: number, to: number) => void
}

export function Palette({ pattern, selected, onSelect, onHighlight, onAdd, onReplace }: Props) {
  const [search, setSearch] = React.useState("")
  const [addOpen, setAddOpen] = React.useState(false)
  const [replaceOpen, setReplaceOpen] = React.useState(false)
  const [inventoryOpen, setInventoryOpen] = React.useState(false)
  const [name, setName] = React.useState("自定义色")
  const [hex, setHex] = React.useState("#D94E78")
  const [target, setTarget] = React.useState(1)
  const counts = new Map(usage(pattern).map((item) => [item.index, item.count]))
  const query = search.trim().toLowerCase()
  const colors = pattern.colors
    .map((color, index) => ({ color, index: index + 1 }))
    .filter(({ color }) =>
      `${color.zh}${color.en}${color.code}`.toLowerCase().includes(query)
    )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium">颜色与用量</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {total(pattern)} 颗 · {counts.size} 种颜色
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{pattern.colors[0]?.brand}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInventoryOpen(true)}
            >
              个人库存
            </Button>
          </div>
        </div>
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="搜索颜色"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索名称或色号"
            className="pl-7"
          />
        </div>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 p-3">
          {colors.map(({ color, index }) => {
            const details = beadColorDetails(color)
            return (
              <Button
                key={color.id}
                variant={selected === index ? "secondary" : "ghost"}
                size="lg"
                className="h-auto w-full justify-start py-2"
                onClick={() => onSelect(index)}
                onMouseEnter={() => counts.has(index) && onHighlight(index)}
                onMouseLeave={() => onHighlight(null)}
              >
                <span
                  className="size-5 shrink-0 rounded-full border"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate">{color.zh}</span>
                  {details && (
                    <span className="block truncate text-[10px] font-normal text-muted-foreground">
                      {details}
                    </span>
                  )}
                </span>
                {counts.has(index) && (
                  <Badge variant="outline">{counts.get(index)}</Badge>
                )}
              </Button>
            )
          })}
        </div>
      </ScrollArea>
      <Separator />
      <div className="grid grid-cols-2 gap-2 p-3">
        <Button variant="outline" onClick={() => setAddOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          自定义色
        </Button>
        <Button variant="outline" disabled={!selected} onClick={() => setReplaceOpen(true)}>
          <HugeiconsIcon icon={Exchange01Icon} strokeWidth={2} data-icon="inline-start" />
          全局替换
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加自定义颜色</DialogTitle>
            <DialogDescription>自定义色仅保存在当前项目中。</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="custom-name">名称</FieldLabel>
              <Input id="custom-name" value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="custom-hex">颜色</FieldLabel>
              <div className="flex gap-2">
                <Input id="custom-hex" type="color" value={hex} onChange={(event) => setHex(event.target.value.toUpperCase())} className="w-14" />
                <Input value={hex} onChange={(event) => setHex(event.target.value.toUpperCase())} />
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button
              onClick={() => {
                if (!/^#[0-9A-F]{6}$/i.test(hex)) return
                onAdd({
                  id: `custom-${crypto.randomUUID()}`,
                  brand: "自定义",
                  series: "项目色板",
                  code: `C${pattern.colors.length + 1}`,
                  zh: name.trim() || "自定义色",
                  en: "Custom",
                  hex: hex as `#${string}`,
                  effect: "solid",
                  auto: true,
                })
                setAddOpen(false)
              }}
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>全局替换颜色</DialogTitle>
            <DialogDescription>把图纸中当前选中的颜色全部换成另一种颜色。</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto py-2">
            {pattern.colors.map((color, index) => (
              <button
                key={color.id}
                type="button"
                title={`${color.zh} ${color.code}`}
                className={cn(
                  "aspect-square rounded-md border p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  target === index + 1 && "ring-2 ring-primary"
                )}
                onClick={() => setTarget(index + 1)}
              >
                <span className="block size-full rounded-sm" style={{ backgroundColor: color.hex }} />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceOpen(false)}>取消</Button>
            <Button
              disabled={!selected || selected === target}
              onClick={() => {
                onReplace(selected, target)
                setReplaceOpen(false)
              }}
            >
              替换
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InventoryDialog
        open={inventoryOpen}
        pattern={pattern}
        onOpen={setInventoryOpen}
      />
    </div>
  )
}
