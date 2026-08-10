import { describe, expect, it } from "vitest"

import { beadColorDetails, uniqueColorLabels } from "@/lib/color/label"

describe("bead color labels", () => {
  it("hides all repeated labels for code-only MARD colors", () => {
    expect(beadColorDetails({ code: "A1", zh: "A1", en: "A1" })).toBe("")
  })

  it("keeps the code but removes a repeated English name", () => {
    expect(
      beadColorDetails({ code: "80-19001", zh: "White", en: "White" })
    ).toBe("80-19001")
  })

  it("keeps distinct code and translated name", () => {
    expect(beadColorDetails({ code: "A01", zh: "白色", en: "White" })).toBe(
      "A01 · White"
    )
  })

  it("deduplicates the code and name used by canvas hover labels", () => {
    expect(uniqueColorLabels("C1", "C1").join(" · ")).toBe("C1")
    expect(uniqueColorLabels("A01", "白色").join(" · ")).toBe("A01 · 白色")
  })
})
