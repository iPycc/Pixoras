"use client"

import * as React from "react"
import {
  ArrowRight01Icon,
  FileExportIcon,
  Folder01Icon,
  FolderOpenIcon,
  Home01Icon,
  ImageUploadIcon,
  PaintBrush01Icon,
  SecurityLockIcon,
  TransparencyIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import { Logo } from "@/components/app/logo"
import { ProcessStrip } from "@/components/app/process-strip"
import { ThemeButton } from "@/components/app/theme"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const facts = [
  { value: "100%", label: "浏览器本地处理", detail: "原图不会上传服务器" },
  { value: "2 套", label: "实体拼豆色卡", detail: "Perler 与 Hama Midi" },
  { value: "200 × 200", label: "最大图纸尺寸", detail: "支持拼板分界与坐标" },
  { value: "3 种", label: "制作文件导出", detail: "PNG、SVG 与 CSV" },
]

const heroPhrases = [
  "把一张图片，变成真正能制作的拼豆图纸。",
  "把喜欢的画面，变成清楚好摆的拼豆图纸。",
  "把你的灵感，变成可以逐格编辑的拼豆图纸。",
] as const

const heroLayoutPhrase = heroPhrases.reduce((longest, phrase) =>
  phrase.length > longest.length ? phrase : longest
)

const demoPatterns = [
  {
    id: "heart",
    name: "桃心",
    art: [
      "000000000000000",
      "000110001100000",
      "001221012210000",
      "012222122221000",
      "012222222221000",
      "001222222210000",
      "000122222100000",
      "000012221000000",
      "000001210000000",
      "000000100000000",
    ],
    palette: [
      { name: "透明", color: "#FFFFFF" },
      { name: "深棕", color: "#2E2927" },
      { name: "粉色", color: "#E96C98" },
    ],
  },
  {
    id: "flower",
    name: "小花",
    art: [
      "000000000000000",
      "000002222200000",
      "000022212220000",
      "000022111220000",
      "000002212200000",
      "000000030000000",
      "000000030000000",
      "000003330000000",
      "000033330000000",
      "000000000000000",
    ],
    palette: [
      { name: "透明", color: "#FFFFFF" },
      { name: "橙黄", color: "#E8A23A" },
      { name: "奶油", color: "#F5D878" },
      { name: "草绿", color: "#5E9C62" },
    ],
  },
  {
    id: "cat",
    name: "小猫",
    art: [
      "000110000011000",
      "001110000111000",
      "001111111111000",
      "011111111111100",
      "011211111121100",
      "011112221111100",
      "001111111111000",
      "000111111110000",
      "000011111100000",
      "000000000000000",
    ],
    palette: [
      { name: "透明", color: "#FFFFFF" },
      { name: "杏色", color: "#E8AA6B" },
      { name: "深棕", color: "#4A3530" },
    ],
  },
  {
    id: "rainbow",
    name: "彩虹",
    art: [
      "000000000000000",
      "000111111111000",
      "001222222222100",
      "012333333333210",
      "123444444444321",
      "123400000004321",
      "123400000004321",
      "123400000004321",
      "000000000000000",
      "000000000000000",
    ],
    palette: [
      { name: "透明", color: "#FFFFFF" },
      { name: "珊瑚", color: "#E66F61" },
      { name: "橙黄", color: "#E8AA4C" },
      { name: "青绿", color: "#59A881" },
      { name: "湖蓝", color: "#5997C9" },
    ],
  },
] as const

export function Home() {
  return (
    <div className="min-h-svh overflow-x-clip bg-background">
      <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4">
        <nav className="flex h-14 w-full max-w-6xl items-center justify-between rounded-full border bg-background/95 px-3 shadow-sm supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur-md">
          <Link
            href="/"
            aria-label="Pixoras 首页"
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo />
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "rounded-full"
              )}
            >
              <HugeiconsIcon
                icon={Home01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              首页
            </Link>
            <Link
              href="/p/new"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "rounded-full"
              )}
            >
              <HugeiconsIcon
                icon={PaintBrush01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              创作台
            </Link>
            <Button
              render={<Link href="/projects" />}
              nativeButton={false}
              variant="ghost"
              size="lg"
              className="rounded-full"
            >
              <HugeiconsIcon
                icon={FolderOpenIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              我的作品
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <ThemeButton />
            <Link
              href="/p/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
            >
              开始制作
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-end"
              />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative border-b">
          <div
            className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
            aria-hidden
          >
            <span className="home-float absolute top-[24%] left-[7%] size-3 rounded-full bg-primary/25" />
            <span
              className="home-float absolute right-[8%] bottom-[18%] size-5 rounded-lg border-2 border-primary/30"
              style={{ animationDelay: "-1.5s" }}
            />
          </div>

          <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-4 pt-36 pb-24 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24 lg:pt-40 lg:pb-28">
            <div className="flex flex-col items-start gap-8">
              <div className="flex flex-col gap-6">
                <h1
                  className="home-rise max-w-3xl font-heading text-5xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[4.25rem]"
                  style={{ "--home-delay": "120ms" } as React.CSSProperties}
                >
                  <TypewriterHeading />
                </h1>
                <p
                  className="home-rise max-w-2xl text-lg leading-8 text-muted-foreground"
                  style={{ "--home-delay": "200ms" } as React.CSSProperties}
                >
                  从裁剪、实体豆色匹配到逐格修正和材料统计，一次完成。透明区域、色号、坐标与拼板分界都替你处理好。
                </p>
              </div>

              <div
                className="home-rise flex flex-wrap gap-3"
                style={{ "--home-delay": "280ms" } as React.CSSProperties}
              >
                <Button
                  render={<Link href="/p/new" />}
                  nativeButton={false}
                  size="lg"
                >
                  <HugeiconsIcon
                    icon={ImageUploadIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  选择图片制作
                </Button>
                <Button
                  render={<Link href="/projects" />}
                  nativeButton={false}
                  variant="outline"
                  size="lg"
                >
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  打开本地作品
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={SecurityLockIcon}
                    strokeWidth={2}
                    className="size-4 shrink-0"
                  />
                  不上传原图
                </span>
                <span className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={TransparencyIcon}
                    strokeWidth={2}
                    className="size-4 shrink-0"
                  />
                  自动保留透明空位
                </span>
                <span className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={FileExportIcon}
                    strokeWidth={2}
                    className="size-4 shrink-0"
                  />
                  PNG、SVG、CSV
                </span>
              </div>
            </div>

            <HeroBoard />
          </div>
        </section>

        <section className="border-b bg-muted/30" aria-label="Pixoras 核心能力">
          <div className="mx-auto grid w-full max-w-7xl px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            {facts.map((fact, index) => (
              <article
                key={fact.label}
                className={cn(
                  "flex flex-col gap-1 border-b py-7 sm:px-6",
                  index % 2 === 0 && "sm:border-r",
                  index >= 2 && "sm:border-b-0",
                  index === 0 && "sm:pl-0",
                  index === facts.length - 1 && "lg:pr-0",
                  "lg:border-r lg:border-b-0",
                  index === facts.length - 1 && "lg:border-r-0"
                )}
              >
                <strong className="font-heading text-2xl font-semibold tracking-tight">
                  {fact.value}
                </strong>
                <span className="text-base font-medium">{fact.label}</span>
                <span className="text-sm leading-6 text-muted-foreground">
                  {fact.detail}
                </span>
              </article>
            ))}
          </div>
        </section>

        <ProcessStrip />

        <section className="border-t bg-muted/30">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-16 sm:px-8 lg:grid-cols-[1fr_auto] lg:py-20">
            <div className="flex max-w-3xl flex-col gap-3">
              <span className="text-sm font-medium text-primary">
                现在就开始
              </span>
              <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                选一张喜欢的图片，几分钟后开始摆豆。
              </h2>
              <p className="text-lg leading-8 text-muted-foreground">
                无需注册，也不需要把图片交给服务器。
              </p>
            </div>
            <Link
              href="/p/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
            >
              开始制作
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-end"
              />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <p>实体色卡为屏幕近似值，制作前请与实物核对。</p>
        </div>
      </footer>
    </div>
  )
}

function TypewriterHeading() {
  const [phraseIndex, setPhraseIndex] = React.useState(0)
  const [displayed, setDisplayed] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(media.matches)

    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  React.useEffect(() => {
    if (reduceMotion) return

    const phrase = heroPhrases[phraseIndex]
    let delay = deleting ? 38 : 72

    if (!deleting && displayed === phrase) {
      delay = 1800
    } else if (deleting && displayed === "") {
      delay = 320
    }

    const timer = window.setTimeout(() => {
      if (!deleting && displayed === phrase) {
        setDeleting(true)
        return
      }

      if (deleting && displayed === "") {
        setPhraseIndex((current) => (current + 1) % heroPhrases.length)
        setDeleting(false)
        return
      }

      setDisplayed(phrase.slice(0, displayed.length + (deleting ? -1 : 1)))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [deleting, displayed, phraseIndex, reduceMotion])

  return (
    <span className="relative block">
      <span className="invisible block" aria-hidden="true">
        {heroLayoutPhrase}
      </span>
      <span className="absolute inset-x-0 top-0" aria-hidden="true">
        {reduceMotion ? heroPhrases[0] : displayed}
        <span className="home-type-caret" />
      </span>
      <span className="sr-only">{heroPhrases[0]}</span>
    </span>
  )
}

function HeroBoard() {
  const [patternIndex, setPatternIndex] = React.useState(0)
  const [reduceMotion, setReduceMotion] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(media.matches)

    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  React.useEffect(() => {
    if (reduceMotion) return

    const timer = window.setInterval(() => {
      setPatternIndex((current) => (current + 1) % demoPatterns.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [reduceMotion])

  const activePatternIndex = reduceMotion ? 0 : patternIndex
  const pattern = demoPatterns[activePatternIndex]
  // Demo bead colors are fixed swatches, never semantic theme colors.
  const colorStats = pattern.palette.slice(1).map((swatch, index) => ({
    ...swatch,
    count: pattern.art.reduce(
      (total, row) =>
        total + [...row].filter((value) => value === String(index + 1)).length,
      0
    ),
  }))
  const beadCount = colorStats.reduce((total, color) => total + color.count, 0)

  return (
    <div
      className="home-rise relative mx-auto w-full max-w-xl"
      style={{ "--home-delay": "180ms" } as React.CSSProperties}
    >
      <Badge
        variant="outline"
        className="home-float absolute -top-4 -right-3 bg-background sm:-right-6"
      >
        透明空位已保留
      </Badge>
      <Badge
        variant="outline"
        className="home-float absolute -bottom-4 -left-3 bg-background sm:-left-6"
        style={{ animationDelay: "-1.2s" }}
      >
        自动匹配实体色号
      </Badge>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span
              className="home-status size-2 rounded-full bg-primary"
              aria-hidden
            />
            实时生成预览
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              {pattern.name} · {activePatternIndex + 1}/{demoPatterns.length}
            </span>
            <span className="font-mono">15 × 10</span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div
            key={pattern.id}
            className="relative overflow-hidden border-t border-l border-[#DED8D3] bg-white"
            aria-label={`${pattern.name}拼豆图案，自动循环预览中的第 ${activePatternIndex + 1} 种`}
          >
            <div className="grid grid-cols-[repeat(15,minmax(0,1fr))]">
              {pattern.art.flatMap((row, y) =>
                [...row].map((value, x) => {
                  const color = Number(value)
                  const index = y * row.length + x
                  return (
                    <span
                      key={`${x}-${y}`}
                      className={cn(
                        "aspect-square border-r border-b border-[#DED8D3]",
                        color > 0 && "home-bead"
                      )}
                      style={
                        {
                          backgroundColor:
                            pattern.palette[color]?.color ?? "#FFFFFF",
                          "--bead-delay": `${120 + index * 12}ms`,
                        } as React.CSSProperties
                      }
                    />
                  )
                })
              )}
            </div>
            <span
              className="home-scan pointer-events-none absolute inset-y-0 w-px bg-primary/70"
              aria-hidden
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {colorStats.map((swatch) => (
                <span key={swatch.name} className="flex items-center gap-2">
                  <i
                    className="size-3 rounded-full"
                    style={{ backgroundColor: swatch.color }}
                  />
                  {swatch.name} {swatch.count}
                </span>
              ))}
            </div>
            <span className="text-sm font-medium text-primary">
              {beadCount} 颗豆 · {colorStats.length} 种颜色
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
