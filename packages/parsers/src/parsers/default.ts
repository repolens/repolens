// packages/parsers/src/parsers/default.ts

import { SemanticParser, mergeChunksByTokenLimit } from '@repolens/core'
import type { ParsedChunk, LensData } from '@repolens/core'

export class DefaultParser extends SemanticParser {
  supports(_file: LensData): boolean {
    return true
  }

  parse(files: LensData[]): ParsedChunk[] {
    const allChunks: ParsedChunk[] = []

    for (const file of files) {
      const baseMeta = {
        ...file.metadata,
        parserType: 'default' as const,
      }

      const chunk: ParsedChunk = {
        content: file.content,
        metadata: baseMeta,
      }

      allChunks.push(
        ...mergeChunksByTokenLimit([chunk], this.maxTokens, baseMeta, 'default')
      )
    }

    return allChunks
  }
}

export function createDefaultParser(maxTokens: number = 8000) {
  return new DefaultParser(maxTokens)
}
