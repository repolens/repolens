import {
  Parser,
  Chunker,
  Embedder,
  ParsedChunk,
  EmbeddedChunk,
  LensData,
} from '@repolens/types'

export abstract class BaseLens {
  constructor(
    protected parser: Parser,
    protected chunker: Chunker,
    protected embedder: Embedder
  ) {}

  /**
   * Subclasses must implement how content is fetched.
   */
  abstract fetch(...args: any[]): Promise<LensData[]>

  /**
   * Optional: Enrich fetched files with metadata before parsing.
   */
  enrich(files: LensData[]): LensData[] {
    return files
  }

  /**
   * Optional: Override how parsing is performed.
   */
  parse(files: LensData[]): ParsedChunk[] {
    return this.parser.parse(files)
  }

  /**
   * Optional: Override how chunking is performed.
   */
  chunk(chunks: ParsedChunk[]): ParsedChunk[] {
    return this.chunker.chunk(chunks)
  }

  /**
   * Optional: Override how embedding is performed.
   */
  async embed(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]> {
    return await this.embedder.embedChunks(chunks)
  }

  /**
   * Full pipeline: fetch → enrich → parse → chunk → embed
   */
  async run(...args: any[]): Promise<EmbeddedChunk[]> {
    const files = await this.fetch(...args)
    const enriched = this.enrich(files)
    const parsed = this.parse(enriched)
    const chunked = this.chunk(parsed)
    const embedded = await this.embed(chunked)

    return embedded
  }
}
