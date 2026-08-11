"use client"

import * as React from "react"
import { Delete02Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { completeColor, completeRow, makingStats } from "@/lib/progress"
import type { Pattern } from "@/types/pattern"

interface Props {
  pattern: Pattern
  selected: number
  completed: number[]
  onChange: (completed: number[]) => void
}

export function MakingBar({ pattern, selected, completed, onChange }: Props) {
  const [row, setRow] = React.useState(1)
  const stats = makingStats(pattern, completed)
  const color = pattern.colors[selected - 1]
  let colorRemaining = 0
  const finished = new Set(completed)
  for (let index = 0; index < pattern.cells.length; index++) {
    if (pattern.cells[index] === selected && !finished.has(index)) {
      colorRemaining++
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
      <Progress value={stats.percent} className="min-w-48 flex-1">
        <ProgressLabel>制作进度</ProgressLabel>
        <ProgressValue>
          {() =>
            `${stats.completed} / ${stats.total} 颗 · 剩余 ${stats.remaining} 颗`
          }
        </ProgressValue>
      </Progress>

      <Button
        variant="outline"
        size="sm"
        disabled={!color || colorRemaining === 0}
        onClick={() => onChange(completeColor(completed, pattern, selected))}
      >
        <span
          className="size-3.5 rounded-full border"
          style={{ backgroundColor: color?.hex }}
          aria-hidden
        />
        完成当前色{color ? `（余 ${colorRemaining}）` : ""}
      </Button>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={1}
          max={pattern.height}
          inputMode="numeric"
          value={row}
          aria-label="要完成的行号"
          className="h-8 w-16"
          onChange={(event) =>
            setRow(
              Math.max(
                1,
                Math.min(pattern.height, Number(event.target.value) || 1)
              )
            )
          }
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(completeRow(completed, pattern, row))}
        >
          <HugeiconsIcon
            icon={Tick02Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          完成该行
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        disabled={completed.length === 0}
        onClick={() => {
          if (window.confirm("确定清空这张图纸的全部制作进度吗？")) onChange([])
        }}
      >
        <HugeiconsIcon
          icon={Delete02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        清空
      </Button>
    </div>
  )
}
