"use client"

import { useSearchParams } from "next/navigation"

import { App } from "@/components/app/app"

export function EditorRoute() {
  const id = useSearchParams().get("id") || "new"

  return <App id={id} />
}
