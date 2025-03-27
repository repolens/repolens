import { Octokit } from 'octokit'
import { GitHubFetcher } from '@repolens/fetchers/github'
import { Parser } from '@repolens/parsers'
import { createDefaultParser } from '@repolens/parsers/default'
import { createTSParser } from '@repolens/parsers/typescript'
import { Vectorizer } from '@repolens/vectorizer'
import type { ParsedChunk, Chunker } from '@repolens/types'

export interface RepoLensConfig {
  owner: string
  repo: string
  ref?: string
  githubToken?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  includeExtensions?: string[]
  excludePaths?: string[]
  excludeRegex?: RegExp[]
}

export interface RepoLensChunk extends ParsedChunk {
  filePath: string
  repo: string
  part?: number
}

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

      const vectorizer = new Vectorizer({
        apiKey: openaiApiKey,
        baseUrl: openaiBaseUrl,
      })

      const chunker: Chunker = {
        chunk: (text) => vectorizer.generateEmbeddableChunks(text, 8000, 0),
      }

      const parser = new Parser({
        fallback: createDefaultParser(chunker),
      })

      parser.register('ts', createTSParser(chunker))
      parser.register('tsx', createTSParser(chunker))
      parser.register('jsx', createTSParser(chunker))
      parser.register('js', createTSParser(chunker))

      const chunks: RepoLensChunk[] = files.flatMap((file) => {
        const parsed = parser.parse(file)
        return parsed.map((chunk) => ({
          ...chunk,
          filePath: file.path,
          repo: `${owner}/${repo}`,
        }))
      })

      const splitChunks: RepoLensChunk[] = []
      const texts: string[] = []

      chunks.forEach((chunk) => {
        const parts = vectorizer.generateEmbeddableChunks(chunk.text, 8000, 0)
        parts.forEach((partText, index) => {
          texts.push(partText)
          splitChunks.push({
            ...chunk,
            text: partText,
            part: parts.length > 1 ? index : undefined,
          })
        })
      })

      const embeddingMap = await vectorizer.embed(texts)

      return splitChunks.map((chunk, i) => ({
        ...chunk,
        embedding: embeddingMap.get(i),
      }))
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
