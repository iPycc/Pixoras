export function encodeRle(values: ArrayLike<number>) {
  const result: number[] = []
  if (values.length === 0) return result

  let value = values[0]
  let count = 1
  for (let index = 1; index < values.length; index++) {
    const next = values[index]
    if (next === value && count < 0xffff_ffff) {
      count++
      continue
    }
    result.push(value, count)
    value = next
    count = 1
  }
  result.push(value, count)
  return result
}

export function decodeRle(data: number[], length: number) {
  if (data.length % 2 !== 0) throw new Error("图纸压缩数据不完整")
  const result = new Uint16Array(length)
  let offset = 0

  for (let index = 0; index < data.length; index += 2) {
    const value = data[index]
    const count = data[index + 1]
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 0xffff ||
      !Number.isInteger(count) ||
      count < 1 ||
      offset + count > length
    ) {
      throw new Error("图纸压缩数据无效")
    }
    result.fill(value, offset, offset + count)
    offset += count
  }

  if (offset !== length) throw new Error("图纸尺寸与压缩数据不匹配")
  return result
}
