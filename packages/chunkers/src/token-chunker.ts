import type { Chunker } from '@repolens/types/chunker'
import type { ParsedChunk } from '@repolens/types/parser'
import type { Embedder } from '@repolens/types/embedder'

export class TokenChunker implements Chunker {
  constructor(
    private embedder: Embedder,
    private maxTokens: number = 8000,
    private overlap: number = 0
  ) {}

  chunk(chunks: ParsedChunk[]): ParsedChunk[] {
    return chunks.flatMap((chunk) => {
      const parts = this.embedder.generateEmbeddableChunks(
        chunk.text,
        this.maxTokens,
        this.overlap
      )

      return parts.map((text, index) => ({
        text,
        metadata: {
          ...chunk.metadata,
          part: parts.length > 1 ? index : (chunk.metadata.part ?? 0),
        },
      }))
    })
  }
}
