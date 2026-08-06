"use client"

import {
  CircleIcon,
  ColorPickerIcon,
  Cursor01Icon,
  Eraser01Icon,
  PaintBoardIcon,
  PaintBrush01Icon,
  RedoIcon,
  SquareIcon,
  UndoIcon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { BeadShape, Tool } from "@/types/pattern"

const tools = [
  { value: "paint", label: "画笔", icon: PaintBrush01Icon },
  { value: "erase", label: "橡皮", icon: Eraser01Icon },
  { value: "pick", label: "吸管", icon: ColorPickerIcon },
  { value: "fill", label: "填充", icon: PaintBoardIcon },
  { value: "pan", label: "移动", icon: Cursor01Icon },
] as const

interface Props {
  tool: Tool
  shape: BeadShape
  zoom: number
  undoable: boolean
  redoable: boolean
  color: string
  onTool: (tool: Tool) => void
  onShape: (shape: BeadShape) => void
  onZoom: (zoom: number) => void
  onUndo: () => void
  onRedo: () => void
}

export function Toolbar({
  tool,
  shape,
  zoom,
  undoable,
  redoable,
  color,
  onTool,
  onShape,
  onZoom,
  onUndo,
  onRedo,
}: Props) {
  return (
    <div
      className="flex min-h-12 items-center gap-2 overflow-x-auto border-b bg-background px-3 py-2"
      data-tour="toolbar"
    >
      <ToggleGroup
        value={[tool]}
        onValueChange={(items) => items[0] && onTool(items[0] as Tool)}
        variant="outline"
        spacing={1}
      >
        {tools.map((item) => (
          <Tooltip key={item.value}>
            <TooltipTrigger
              render={
                <ToggleGroupItem value={item.value} aria-label={item.label}>
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                </ToggleGroupItem>
              }
            />
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup>

      <span
        className="size-5 shrink-0 rounded-full border"
        style={{ backgroundColor: color }}
        aria-label={`当前颜色 ${color}`}
      />
      <Separator orientation="vertical" className="h-5" />
      <ToggleGroup
        value={[shape]}
        onValueChange={(items) => items[0] && onShape(items[0] as BeadShape)}
        variant="outline"
        spacing={1}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <ToggleGroupItem value="circle" aria-label="圆形豆粒">
                <HugeiconsIcon icon={CircleIcon} strokeWidth={2} />
              </ToggleGroupItem>
            }
          />
          <TooltipContent>圆形豆粒</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <ToggleGroupItem value="square" aria-label="方形色格">
                <HugeiconsIcon icon={SquareIcon} strokeWidth={2} />
              </ToggleGroupItem>
            }
          />
          <TooltipContent>方形色格</TooltipContent>
        </Tooltip>
      </ToggleGroup>
      <Separator orientation="vertical" className="h-5" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!undoable}
        onClick={onUndo}
        aria-label="撤销"
      >
        <HugeiconsIcon icon={UndoIcon} strokeWidth={2} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!redoable}
        onClick={onRedo}
        aria-label="重做"
      >
        <HugeiconsIcon icon={RedoIcon} strokeWidth={2} />
      </Button>
      <Separator orientation="vertical" className="h-5" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onZoom(Math.max(25, zoom - 25))}
        aria-label="缩小"
      >
        <HugeiconsIcon icon={ZoomOutAreaIcon} strokeWidth={2} />
      </Button>
      <span className="min-w-12 text-center font-mono text-xs text-muted-foreground">
        {zoom}%
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onZoom(Math.min(800, zoom + 25))}
        aria-label="放大"
      >
        <HugeiconsIcon icon={ZoomInAreaIcon} strokeWidth={2} />
      </Button>
    </div>
  )
}
