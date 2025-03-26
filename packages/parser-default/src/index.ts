import type { Chunker, FileInput, ParsedChunk } from '@repolens/types'

export type { Chunker, FileInput, ParsedChunk }
export function createDefaultParser(chunker: Chunker) {
  return function parseDefault(file: FileInput): ParsedChunk[] {
    const parts = chunker.chunk(file.content, { path: file.path })

    return parts.map((text, index) => ({
      type: 'text',
      name: `part-${index + 1}`,
      text,
      path: file.path,
      language: 'plain',
      metadata: { part: index },
    }))
  }
}
