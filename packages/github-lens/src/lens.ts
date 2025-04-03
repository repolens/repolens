// packages/github-lens/src/github-lens.ts

import {
  Lens,
  type LensData,
  type ParsedChunk,
  type EmbeddedChunk,
} from '@repolens/core'
import { DefaultSemanticParser } from '@repolens/parsers'
import { OpenAIEmbedder, type EmbedderOptions } from '@repolens/embedders'
import type { SemanticParser, Embedder } from '@repolens/core'
import { GitHubFetcher, type GitHubFetcherInput } from './fetcher.js'

export interface GitHubLensConfig {
  fetcherOptions: GitHubFetcherInput
  parser?: SemanticParser
  embedder?: Embedder
  embedderOptions?: EmbedderOptions
  maxTokens?: number
}

export class GitHubLens extends Lens {
  private readonly fetcher: GitHubFetcher
  private readonly parser: SemanticParser
  private readonly embedder: Embedder

  constructor(config: GitHubLensConfig) {
    super()
    const {
      parser,
      embedder,
      embedderOptions,
      fetcherOptions,
      maxTokens = 8000,
    } = config

    this.fetcher = new GitHubFetcher(fetcherOptions)
    this.parser = parser ?? new DefaultSemanticParser(maxTokens)
    this.embedder = embedder ?? new OpenAIEmbedder(embedderOptions)
  }

  async fetch(): Promise<LensData[]> {
    return this.fetcher.fetch()
  }

  parse(data: LensData[]): ParsedChunk[] {
    return this.parser.parse(data)
  }

  async embed(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]> {
    return this.embedder.embedChunks(chunks)
  }
}
