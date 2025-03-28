import { Octokit } from 'octokit'
import { GitHubFetcher } from '@repolens/fetchers/github'
import { ParserManager } from '@repolens/parsers'
import { TokenChunker } from '@repolens/chunkers/token'
import { createDefaultParser } from '@repolens/parsers/default'
import { createTSParser } from '@repolens/parsers/typescript'
import { OpenAIEmbedder } from '@repolens/embedders/openai'
import type { ParsedChunk } from '@repolens/types/parser'
import type { RepoLensConfig, RepoLensChunk } from '@repolens/types/repolens'

export class RepoLens {
  constructor(private config: RepoLensConfig) {
    this.config.githubToken ||= process.env.GITHUB_TOKEN
    this.config.openaiApiKey ||= process.env.OPENAI_API_KEY
  }

  async run(): Promise<RepoLensChunk[]> {
    try {
      const {
        owner,
        repo,
        ref,
        githubToken,
        openaiApiKey,
        openaiBaseUrl,
        includeExtensions,
        excludePaths,
        excludeRegex,
      } = this.config

      const octokit = new Octokit({ auth: githubToken })
      const fetcher = new GitHubFetcher(octokit)

      const files = await fetcher.fetch({
        owner,
        repo,
        ref,
        includePaths: new Set(),
      })

      const embedder = new OpenAIEmbedder({
        apiKey: openaiApiKey,
        baseUrl: openaiBaseUrl,
      })
      const tokenChunker = new TokenChunker(embedder)

      const parser = new ParserManager({
        fallback: createDefaultParser(tokenChunker),
      })

      parser.register(['ts', 'tsx', 'jsx', 'js'], createTSParser(tokenChunker))

      const parsedChunks = files.flatMap((file) => parser.parse(file))
      const safeChunks = tokenChunker.chunk(parsedChunks)

      const embeddingMap = await embedder.embed(
        safeChunks.map((chunk: ParsedChunk) => chunk.text)
      )

      return safeChunks.map((chunk: ParsedChunk, i: number) => ({
        ...chunk,
        repo: `${owner}/${repo}`,
        embedding: embeddingMap.get(i),
      }))
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
