import toml from '@iarna/toml'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  let parsed: any
  try {
    parsed = toml.parse(content)
  } catch (e) {
    return []
  }

  const chunks: ParsedChunk[] = []

  for (const [key, value] of Object.entries(parsed)) {
    chunks.push({
      type: 'toml-key',
      name: key,
      text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    })
  }

  return chunks
}
