// packages/core/src/abstract/lens.ts

import type { LensData } from '../types/data.js'
import type { ParsedChunk } from '../types/chunk.js'
import type { EmbeddedChunk } from '../types/embedder.js'

/**
 * A Lens is the high-level orchestrator responsible for
 * fetching, parsing, chunking, and embedding source data.
 */
export abstract class Lens {
  abstract fetch(): Promise<LensData[]>

  enrich(data: LensData[]): LensData[] {
    return data
  }

  abstract parse(data: LensData[]): ParsedChunk[]

  abstract embed(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]>

  async run(): Promise<EmbeddedChunk[]> {
    const data = await this.fetch()
    const enriched = this.enrich(data)
    const parsed = this.parse(enriched)
    const embedded = await this.embed(parsed)
    return embedded
  }
}
