// packages/github-lens/src/github-lens.ts

import {
  Lens,
  type LensData,
  type ParsedChunk,
  type EmbeddedChunk,
  getTokenCount,
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
  debug?: boolean
}

export class GitHubLens extends Lens {
  private readonly fetcher: GitHubFetcher
  private readonly parser: SemanticParser
  private readonly embedder: Embedder
  private readonly debug: boolean
  private readonly maxTokens: number

  constructor(config: GitHubLensConfig) {
    super()
    const {
      parser,
      embedder,
      embedderOptions,
      fetcherOptions,
      maxTokens = 8000,
      debug = false,
    } = config

    this.fetcher = new GitHubFetcher(fetcherOptions)
    this.parser = parser ?? new DefaultSemanticParser(maxTokens)
    this.embedder = embedder ?? new OpenAIEmbedder(embedderOptions)
    this.debug = debug
    this.maxTokens = maxTokens

    if (debug) {
      console.log(`[GITHUB-LENS] Initialized with max tokens: ${maxTokens}`)
      console.log(
        `[GITHUB-LENS] Non-parsable files will${fetcherOptions.excludeNonParsable ? ' ' : ' not '}be excluded`
      )
    }
  }

  async fetch(): Promise<LensData[]> {
    if (this.debug) console.log('[GITHUB-LENS] Starting fetch operation')
    const data = await this.fetcher.fetch()

    if (this.debug) {
      console.log(`[GITHUB-LENS] Fetched ${data.length} files`)

      // Log file size statistics
      const sizes = data.map((file) => file.content.length)
      const totalSize = sizes.reduce((sum, size) => sum + size, 0)
      const avgSize = Math.round(totalSize / data.length)
      const maxSize = Math.max(...sizes)
      const minSize = Math.min(...sizes)

      console.log(`[GITHUB-LENS] Files statistics:
        Total size: ${totalSize} chars
        Average size: ${avgSize} chars
        Largest file: ${maxSize} chars
        Smallest file: ${minSize} chars
      `)

      // Log largest files
      const largestFiles = [...data]
        .sort((a, b) => b.content.length - a.content.length)
        .slice(0, 3)

      console.log('[GITHUB-LENS] Largest files:')
      largestFiles.forEach((file) => {
        const filePath = file.metadata?.path || 'unknown'
        console.log(`  ${filePath} - ${file.content.length} chars`)
      })
    }

    return data
  }

  parse(data: LensData[]): ParsedChunk[] {
    if (this.debug)
      console.log(
        `[GITHUB-LENS] Starting parse operation on ${data.length} files`
      )

    const chunks = this.parser.parse(data)

    if (this.debug) {
      console.log(`[GITHUB-LENS] Parsed ${chunks.length} chunks`)

      // Log chunk size statistics
      const tokenCounts = chunks.map((chunk) => getTokenCount(chunk.content))
      const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0)
      const avgTokens = Math.round(totalTokens / chunks.length)
      const maxTokens = Math.max(...tokenCounts)
      const minTokens = Math.min(...tokenCounts)

      console.log(`[GITHUB-LENS] Chunks token statistics:
        Total tokens: ${totalTokens}
        Average tokens per chunk: ${avgTokens}
        Largest chunk: ${maxTokens} tokens
        Smallest chunk: ${minTokens} tokens
      `)

      // Check chunks that might cause token limit issues
      const largeChunks = chunks.filter((chunk) => {
        const tokens = getTokenCount(chunk.content)
        return tokens > 8000
      })

      if (largeChunks.length > 0) {
        console.warn(
          `[GITHUB-LENS] WARNING: Found ${largeChunks.length} chunks exceeding 8000 tokens`
        )
        largeChunks.forEach((chunk) => {
          const tokens = getTokenCount(chunk.content)
          console.warn(
            `[GITHUB-LENS] Large chunk (${tokens} tokens): `,
            chunk.metadata
          )
        })
      }

      // Check if any chunks exceed OpenAI's limit
      const criticalChunks = chunks.filter((chunk) => {
        const tokens = getTokenCount(chunk.content)
        return tokens > 8192
      })

      if (criticalChunks.length > 0) {
        console.error(
          `[GITHUB-LENS] CRITICAL: Found ${criticalChunks.length} chunks exceeding OpenAI's 8192 token limit`
        )
        criticalChunks.forEach((chunk) => {
          const tokens = getTokenCount(chunk.content)
          console.error(
            `[GITHUB-LENS] Critical chunk (${tokens} tokens): `,
            chunk.metadata
          )
          console.error(
            `[GITHUB-LENS] Preview: ${chunk.content.substring(0, 200)}...`
          )
        })
      }
    }

    return chunks
  }

  async embed(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]> {
    if (this.debug)
      console.log(
        `[GITHUB-LENS] Starting embed operation on ${chunks.length} chunks`
      )

    try {
      const embedded = await this.embedder.embedChunks(chunks)

      if (this.debug) {
        console.log(
          `[GITHUB-LENS] Successfully embedded ${embedded.length} chunks`
        )
      }

      return embedded
    } catch (error: any) {
      console.error('[GITHUB-LENS] Error during embedding:', error)

      // If there's a token limit error, provide more detailed information
      if (
        error?.message &&
        typeof error.message === 'string' &&
        error.message.includes('maximum context length')
      ) {
        console.error(
          '[GITHUB-LENS] Error appears to be related to token limits'
        )

        // Find and log chunks that might be causing the issue
        const sortedChunks = [...chunks]
          .map((chunk) => ({
            chunk,
            tokens: getTokenCount(chunk.content),
          }))
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 5)

        console.error(
          '[GITHUB-LENS] Top 5 largest chunks that might be causing the issue:'
        )
        sortedChunks.forEach(({ chunk, tokens }) => {
          console.error(
            `[GITHUB-LENS] Chunk with ${tokens} tokens:`,
            chunk.metadata
          )
          if (tokens > 8192) {
            console.error(
              '[GITHUB-LENS] This chunk exceeds OpenAI token limit (8192)'
            )
          }
        })
      }

      throw error
    }
  }
}
