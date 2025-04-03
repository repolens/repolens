import type { ParsedChunk } from './chunk.js'

export interface EmbeddedChunk extends ParsedChunk {
  embedding: number[]
}
