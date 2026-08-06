import type { Metadata } from "next"

import { ProjectsPage } from "@/features/projects/page"

export const metadata: Metadata = {
  title: "我的作品 — Pixoras",
  description: "查看、管理和继续编辑保存在当前设备上的拼豆图纸。",
}

export default function Page() {
  return <ProjectsPage />
}
