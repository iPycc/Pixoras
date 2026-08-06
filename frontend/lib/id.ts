const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"

export function shortId(length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("")
}
