import * as React from "react"

import { EditorRoute } from "@/components/app/editor-route"

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <EditorRoute />
    </React.Suspense>
  )
}
