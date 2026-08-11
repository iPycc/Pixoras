"use client"

import * as React from "react"

import {
  INVENTORY_CHANGED,
  readInventory,
  type InventoryCounts,
} from "@/lib/inventory"

export function useInventory() {
  const [counts, setCounts] = React.useState<InventoryCounts>({})

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCounts(readInventory())
    })
    const refresh = () => setCounts(readInventory())

    window.addEventListener(INVENTORY_CHANGED, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener(INVENTORY_CHANGED, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  return counts
}
