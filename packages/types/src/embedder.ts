import type { ParsedChunk } from './chunk.js'

export interface Embedder {
  embed(texts: string[]): Promise<Map<number, number[]>>
  embedChunks(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]>
}

export interface EmbeddedChunk extends ParsedChunk {
  embedding: number[]
}
