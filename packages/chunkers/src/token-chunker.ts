import type { Chunker, ParsedChunk, Embedder } from '@repolens/types'

export class TokenChunker implements Chunker {
  constructor(
    private embedder: Embedder,
    private maxTokens: number = 8000,
    private overlap: number = 0
  ) {}

  chunk(chunks: ParsedChunk[]): ParsedChunk[] {
    return chunks.flatMap((chunk) => {
      const parts = this.embedder.generateEmbeddableChunks(
        chunk.content,
        this.maxTokens,
        this.overlap
      )

      return parts.map((text, index) => ({
        content: text,
        metadata: {
          ...chunk.metadata,
          part: parts.length > 1 ? index : (chunk.metadata.part ?? 0),
        },
      }))
    })
  }
}
