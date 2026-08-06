import { App } from "@/components/app/app"

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  return <App id={id} />
}
