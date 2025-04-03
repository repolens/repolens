import type { LensData, ParsedChunk } from '../types/index.js'
import { mergeChunksByTokenLimit } from '../utils/token-utils.js'

export abstract class SemanticParser {
  constructor(protected readonly maxTokens: number = 8000) {}

  /**
   * Determines if this parser should handle the given file.
   */
  abstract supports(file: LensData): boolean

  /**
   * Parses a list of LensData files into token-aware ParsedChunks.
   */
  abstract parse(files: LensData[]): ParsedChunk[]

  protected mergeChunks(
    raw: ParsedChunk[],
    baseMeta: Record<string, unknown>,
    parserType: string
  ): ParsedChunk[] {
    return mergeChunksByTokenLimit(raw, this.maxTokens, baseMeta, parserType)
  }
}
