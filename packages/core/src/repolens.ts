import { GitHubFetcher } from '@repolens/fetchers/github'
import { RepoLensParser } from '@repolens/parsers'
import { TokenChunker } from '@repolens/chunkers/token'
import { createTSParser } from '@repolens/parsers/typescript'
import { OpenAIEmbedder } from '@repolens/embedders/openai'
import type { ParsedChunk, Parser } from '@repolens/types/parser'
import type { RepoLensConfig, RepoLensChunk } from '@repolens/types/repolens'
import { Chunker } from '@repolens/types/chunker'
import { Fetcher } from '@repolens/types/fetcher'
import { Embedder, EmbeddedChunk } from '@repolens/types/embedder'
export interface GitHubRunInput {
  owner: string
  repo: string
  ref?: string
}

export type RepoLensRunInput<T = any> = GitHubRunInput | T

export class RepoLens {
  private parser: Parser
  private embedder: Embedder
  private chunker: Chunker
  private fetcher?: Fetcher

  constructor(config?: RepoLensConfig) {
    this.embedder = config?.embedder ?? new OpenAIEmbedder()
    this.chunker = config?.chunker ?? new TokenChunker(this.embedder, 8000, 200)
    this.parser = config?.parser ?? new RepoLensParser(this.chunker)
    this.fetcher = config?.fetcher
  }

  static create(config?: ConstructorParameters<typeof RepoLens>[0]) {
    return new RepoLens(config)
  }

  async run<T extends object = GitHubRunInput>(
    input: T
  ): Promise<EmbeddedChunk[]> {
    let fetcher: Fetcher<T>

    if (this.fetcher) {
      fetcher = this.fetcher as Fetcher<T>
    } else if ('owner' in input && 'repo' in input) {
      const { owner, repo, ref } = input as GitHubRunInput
      fetcher = new GitHubFetcher({ owner, repo, ref })
    } else {
      throw new Error('No fetcher provided, and input in not Github-compatible')
    }

    const files = await fetcher.fetch(input)
    const parsed = this.parser.parse(files)
    const embedded = await this.embedder.embedChunks(parsed)

    return embedded
  }
}
