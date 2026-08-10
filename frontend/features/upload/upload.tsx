"use client"

import * as React from "react"
import {
  GridIcon,
  ImageUploadIcon,
  MagicWand01Icon,
  SecurityLockIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

export function Upload({
  onFile,
  onBlank,
}: {
  onFile: (file: File) => void
  onBlank: () => void
}) {
  const input = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const accept = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onFile(file)
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col justify-center px-4 pt-28 pb-16 sm:px-8">
      <section className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24">
        <div className="flex flex-col gap-8">
          <div
            className="home-rise flex flex-col gap-6"
            style={{ "--home-delay": "120ms" } as React.CSSProperties}
          >
            <h1 className="max-w-3xl font-heading text-5xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[4.25rem]">
              把喜欢的图片，变成真正能制作的拼豆图纸。
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              自动匹配 MARD、Artkal、Perler、Hama
              等实体豆色，支持主体提取、逐格修改和用量统计。
            </p>
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              ["01", "导入或新建", "从图片转换，也可空白创作"],
              ["02", "调整图纸", "尺寸、色数和透明背景"],
              ["03", "编辑导出", "PNG、SVG 与用量表"],
            ].map(([number, title, text], index) => (
              <div
                key={number}
                className="home-rise flex gap-3"
                style={
                  {
                    "--home-delay": `${240 + index * 70}ms`,
                  } as React.CSSProperties
                }
              >
                <span className="font-mono text-xs text-primary">{number}</span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Empty
          className={cn(
            "home-rise min-h-96 border bg-card/40 transition-colors",
            dragging && "border-primary bg-primary/5"
          )}
          style={{ "--home-delay": "200ms" } as React.CSSProperties}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            accept(event.dataTransfer.files)
          }}
        >
          <EmptyHeader className="gap-2">
            <EmptyMedia variant="icon">
              <HugeiconsIcon
                icon={ImageUploadIcon}
                strokeWidth={2}
                className="home-float"
              />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold">
              选择创作方式
            </EmptyTitle>
            <EmptyDescription className="text-sm leading-6">
              导入图片自动转换，或新建空白画布逐格绘制；也可把图片拖放到这里。
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => accept(event.target.files)}
            />
            <Button
              className="text-base"
              size="lg"
              onClick={() => input.current?.click()}
            >
              <HugeiconsIcon
                icon={ImageUploadIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              导入图片
            </Button>
            <Button
              className="text-base"
              variant="outline"
              size="lg"
              onClick={onBlank}
            >
              <HugeiconsIcon
                icon={GridIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              新建空白图纸
            </Button>
            <Button
              className="text-base"
              variant="ghost"
              size="lg"
              onClick={() => onFile(sample())}
            >
              <HugeiconsIcon
                icon={MagicWand01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              试用示例
            </Button>
          </EmptyContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon
              icon={SecurityLockIcon}
              strokeWidth={2}
              className="size-4"
            />
            普通转换完全本地处理 · AI 插画仅在确认后上传 · 最大 25MB
          </div>
        </Empty>
      </section>
    </main>
  )
}

function sample() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="580" height="580" viewBox="0 0 29 29"><rect width="29" height="29" fill="none"/><g shape-rendering="crispEdges"><path fill="#202124" d="M10 4h9v2h3v3h2v11h-2v3h-3v2h-9v-2H7v-3H5V9h2V6h3z"/><path fill="#F5F4EF" d="M10 6h9v2h3v12h-3v3h-9v-3H7V9h3z"/><path fill="#EB78A8" d="M10 9h3v3h-3zm6 0h3v3h-3zM9 17h2v2h2v2h3v-2h2v-2h2v3h-2v2h-2v2h-4v-2h-2v-2H8z"/><path fill="#FFD52B" d="M13 13h3v3h-3z"/></g></svg>`
  return new File([svg], "pixoras-demo.svg", { type: "image/svg+xml" })
}
