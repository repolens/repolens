import { splitChunkText } from '@repo-vector/utils/splitChunkText'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const parts = splitChunkText(content)

  return parts.map((text, i) => ({
    type: 'text',
    name: `chunk_${i}`,
    text,
  }))
}
