import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const sources = path.join(root, "data", "sources")
const output = path.join(root, "data", "palette-data.json")

const files = {
  perler: "perler.csv",
  "perler-mini": "perler_mini.csv",
  "perler-caps": "perler_caps.csv",
  hama: "hama.csv",
  "artkal-s": "artkal_s.csv",
  "artkal-r": "artkal_r.csv",
  "artkal-c": "artkal_c.csv",
  "artkal-a": "artkal_a.csv",
  nabbi: "nabbi.csv",
  yant: "yant.csv",
}

const palettes = {}
for (const [id, file] of Object.entries(files)) {
  palettes[id] = parse(await readFile(path.join(sources, file), "utf8"))
}

for (const series of ["s", "c"]) {
  const id = `artkal-${series}`
  const official = parse(
    await readFile(
      path.join(sources, `artkal_${series}_official_rgb.csv`),
      "utf8"
    )
  )
  const merged = new Map(palettes[id].map((row) => [row[0], row]))
  for (const row of official) merged.set(row[0], row)
  palettes[id] = [...merged.values()].sort((a, b) => natural(a[0], b[0]))
}

const html = await fetch(
  "https://www.pixel-beads.com/zh/mard-bead-color-chart"
).then((response) => {
  if (!response.ok) throw new Error(`MARD request failed: ${response.status}`)
  return response.text()
})
const mard = [
  ...html.matchAll(
    /<span>([A-Z]{1,2}\d{1,2})<\/span>.*?aria-label="复制 HEX (#[0-9A-F]{6})"/gs
  ),
].map((match) => {
  const [r, g, b] = hexRgb(match[2])
  return [match[1], match[1], r, g, b, "pixel-beads.com"]
})
if (mard.length !== 291) {
  throw new Error(`Expected 291 MARD colors, received ${mard.length}`)
}
palettes["mard-291"] = mard

for (const [id, rows] of Object.entries(palettes)) validate(id, rows)

await writeFile(
  output,
  `${JSON.stringify({ generatedAt: "2026-08-11", palettes }, null, 2)}\n`,
  "utf8"
)
console.log(
  Object.entries(palettes)
    .map(([id, rows]) => `${id}: ${rows.length}`)
    .join("\n")
)

function parse(text) {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [code, name, r, g, b, source] = csv(line)
      return [code, name, Number(r), Number(g), Number(b), source]
    })
}

function csv(line) {
  const values = []
  let value = ""
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (character === "," && !quoted) {
      values.push(value)
      value = ""
    } else {
      value += character
    }
  }
  values.push(value)
  return values
}

function validate(id, rows) {
  const codes = new Set()
  for (const [code, name, r, g, b] of rows) {
    if (!code || !name) throw new Error(`${id}: missing code or name`)
    if (codes.has(code)) throw new Error(`${id}: duplicate code ${code}`)
    codes.add(code)
    if (
      ![r, g, b].every(
        (value) => Number.isInteger(value) && value >= 0 && value <= 255
      )
    ) {
      throw new Error(`${id}: invalid RGB for ${code}`)
    }
  }
}

function natural(a, b) {
  return a.localeCompare(b, "en", { numeric: true })
}

function hexRgb(hex) {
  return [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16)
  )
}
