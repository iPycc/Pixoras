"use client"

import * as React from "react"
import { Download04Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useInventory } from "@/features/inventory/use-inventory"
import { save } from "@/lib/export"
import { shortageCsv, shortages, writeInventory } from "@/lib/inventory"
import { usage } from "@/lib/pattern/edit"
import type { Pattern } from "@/types/pattern"

interface Props {
  open: boolean
  pattern: Pattern
  onOpen: (open: boolean) => void
}

export function InventoryDialog({ open, pattern, onOpen }: Props) {
  const counts = useInventory()
  const [query, setQuery] = React.useState("")
  const needed = React.useMemo(
    () => new Map(usage(pattern).map((item) => [item.color.id, item.count])),
    [pattern]
  )
  const missing = React.useMemo(
    () => shortages(pattern, counts),
    [counts, pattern]
  )
  const missingColors = missing.length
  const missingBeads = missing.reduce((sum, item) => sum + item.missing, 0)
  const search = query.trim().toLowerCase()
  const colors = pattern.colors.filter((color) =>
    `${color.code}${color.zh}${color.en}`.toLowerCase().includes(search)
  )

  const update = (id: string, amount: number) => {
    const next = { ...counts }
    if (amount > 0) next[id] = Math.floor(amount)
    else delete next[id]
    try {
      writeInventory(next)
    } catch {
      toast.error("无法保存个人库存，请检查浏览器存储权限")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="grid h-[min(780px,calc(100dvh-2rem))] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>个人拼豆库存</DialogTitle>
          <DialogDescription>
            记录当前色卡的可用数量，自动计算缺豆并生成采购清单。
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="border-b px-6 py-4">
          <Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <FieldLabel htmlFor="inventory-search">查找颜色</FieldLabel>
                <FieldDescription>
                  {missingColors > 0
                    ? `当前图纸还缺 ${missingBeads} 颗、${missingColors} 种颜色`
                    : "当前库存可以完成这张图纸"}
                </FieldDescription>
              </div>
              <Badge variant={missingColors > 0 ? "outline" : "secondary"}>
                {Object.keys(counts).length} 个库存色
              </Badge>
            </div>
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="inventory-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索名称或色号"
                className="pl-7"
              />
            </div>
          </Field>
        </FieldGroup>

        <ScrollArea className="min-h-0">
          <div className="divide-y px-6">
            {colors.map((color) => {
              const required = needed.get(color.id) ?? 0
              const owned = counts[color.id] ?? 0
              const short = Math.max(0, required - owned)
              return (
                <Field key={color.id} orientation="horizontal" className="py-3">
                  <span
                    className="size-7 shrink-0 rounded-md border"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <FieldLabel htmlFor={`inventory-${color.id}`}>
                      {color.zh} · {color.code}
                    </FieldLabel>
                    <FieldDescription>
                      {required > 0
                        ? `图纸需要 ${required} 颗`
                        : "当前图纸未使用"}
                      {short > 0 ? ` · 缺 ${short} 颗` : ""}
                    </FieldDescription>
                  </div>
                  <Input
                    id={`inventory-${color.id}`}
                    type="number"
                    min={0}
                    max={99999}
                    inputMode="numeric"
                    value={owned || ""}
                    placeholder="0"
                    aria-label={`${color.zh} ${color.code} 库存数量`}
                    className="w-24"
                    onChange={(event) =>
                      update(color.id, Number(event.target.value))
                    }
                  />
                </Field>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            disabled={missingColors === 0}
            onClick={async () => {
              await save(
                new Blob([shortageCsv(pattern, counts)], {
                  type: "text/csv;charset=utf-8",
                }),
                "Pixoras-缺豆采购清单.csv"
              )
              toast.success("缺豆采购清单已生成")
            }}
          >
            <HugeiconsIcon
              icon={Download04Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            导出缺豆清单
          </Button>
          <Button onClick={() => onOpen(false)}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
