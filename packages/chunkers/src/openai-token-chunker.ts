import type { Chunker, ParsedChunk } from '@repolens/types'
import { chunkWithGPTTokenizer } from '@repolens/utils'

export class OpenAITokenChunker implements Chunker {
  constructor(
    private maxTokens: number = 8000,
    private overlap: number = 0
  ) {}

  chunk(chunks: ParsedChunk[]): ParsedChunk[] {
    return chunks.flatMap((chunk) => {
      const parts = chunkWithGPTTokenizer(
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
