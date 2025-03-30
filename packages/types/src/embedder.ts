import { ParsedChunk } from './parser.js'

export interface Embedder {
  embed(texts: string[]): Promise<Map<number, number[]>>
  embedChunks(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]>
  generateEmbeddableChunks(
    text: string,
    tokenLimit?: number,
    overlap?: number
  ): string[]
}

export interface EmbeddedChunk extends ParsedChunk {
  embedding: number[]
}
