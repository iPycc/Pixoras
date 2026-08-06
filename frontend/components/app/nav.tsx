"use client"

import {
  Add01Icon,
  Download04Icon,
  FolderOpenIcon,
  Home01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import { Logo } from "@/components/app/logo"
import { ThemeButton } from "@/components/app/theme"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Props {
  ready: boolean
  onNew: () => void
  onExport: () => void
}

export function Nav({ ready, onNew, onExport }: Props) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4">
      <nav className="pointer-events-auto flex h-14 w-full max-w-5xl items-center justify-between rounded-full border bg-background/95 px-3 shadow-sm supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="返回首页"
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo />
          </Link>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="ghost"
            size="lg"
            className="rounded-full"
          >
            <HugeiconsIcon
              icon={Home01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            首页
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full"
            onClick={onNew}
          >
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            新建
          </Button>
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
          {ready && (
            <Button
              size="lg"
              className="rounded-full"
              onClick={onExport}
              data-tour="export"
            >
              <HugeiconsIcon
                icon={Download04Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              <span className="hidden sm:inline">导出</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="rounded-full md:hidden"
                />
              }
            >
              <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
              <span className="sr-only">打开菜单</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href="/" />}>
                  <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                  首页
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNew}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                  新建图纸
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/projects" />}>
                  <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
                  我的作品
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}
