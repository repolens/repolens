import { OpenAIEmbedder } from '@repolens/embedders/openai'
import { BaseLens } from './base-lens.js'
import { GitHubFetcher } from '@repolens/fetchers/github'
import { OpenAITokenChunker } from '@repolens/chunkers/openai'
import { RepoLensParser } from '@repolens/parsers'
import { Fetcher, LensData } from '@repolens/types'

export interface GithubLensOptions {
  owner: string
  repo: string
  ref?: string
}

export class GithubLens extends BaseLens {
  name = 'github'
  private fetcher: Fetcher

  constructor({ owner, repo, ref }: GithubLensOptions) {
    const embedder = new OpenAIEmbedder()
    const chunker = new OpenAITokenChunker(8000, 200)
    const parser = new RepoLensParser()

    super(parser, chunker, embedder)
    this.fetcher = new GitHubFetcher({
      owner,
      repo,
      ref,
    })
  }

  async fetch(): Promise<LensData[]> {
    return this.fetcher.fetch()
  }
}
