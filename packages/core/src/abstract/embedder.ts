import type { ParsedChunk } from '../types/chunk.js'
import type { EmbeddedChunk } from '../types/embedder.js'

/**
 * An Embedder is responsible for converting parsed chunks into vector-embedded chunks.
 */
export abstract class Embedder {
  /**
   * Convert parsed chunks into embedded chunks with vector data.
   */
  abstract embedChunks(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]>
}
