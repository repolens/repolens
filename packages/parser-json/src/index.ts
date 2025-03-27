export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  let obj
  try {
    obj = JSON.parse(content)
  } catch (e) {
    return []
  }

  const chunks: ParsedChunk[] = []

  for (const [key, value] of Object.entries(obj)) {
    chunks.push({
      type: 'json-key',
      name: key,
      text: JSON.stringify(value, null, 2),
    })
  }

  return chunks
}
