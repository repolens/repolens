import yaml from 'yaml'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  let parsed: any
  try {
    parsed = yaml.parse(content)
  } catch (e) {
    return []
  }

  const chunks: ParsedChunk[] = []

  for (const [key, value] of Object.entries(parsed ?? {})) {
    chunks.push({
      type: 'yaml-key',
      name: key,
      text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    })
  }

  return chunks
}
