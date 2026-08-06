"use client"

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="切换亮色或暗色模式"
            onClick={() => setTheme(dark ? "light" : "dark")}
          />
        }
      >
        <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className="block dark:hidden" />
        <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} className="hidden dark:block" />
      </TooltipTrigger>
      <TooltipContent>{dark ? "亮色模式" : "暗色模式"}（D）</TooltipContent>
    </Tooltip>
  )
}
