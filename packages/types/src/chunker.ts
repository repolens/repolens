import type { ParsedChunk } from './chunk.js'

export interface Chunker {
  chunk(chunks: ParsedChunk[]): ParsedChunk[]
}
