import OpenAI from 'openai'
import type { EmbeddedChunk, Embedder, ParsedChunk } from '@repolens/core'
import { getOpenaiConfig } from '@repolens/config'

export interface EmbedderOptions {
  model?:
    | 'text-embedding-3-small'
    | 'text-embedding-3-large'
    | 'text-embedding-ada-002'
  apiKey?: string
  baseURL?: string
  client?: OpenAI
}

export class OpenAIEmbedder implements Embedder {
  private readonly openai: OpenAI
  readonly model: EmbedderOptions['model']

  constructor(options: EmbedderOptions = {}) {
    this.openai =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey ?? getOpenaiConfig().OPENAI_API_KEY,
        baseURL: options.baseURL ?? getOpenaiConfig().OPENAI_BASE_URL,
      })

    this.model = options.model ?? 'text-embedding-3-small'
  }

  async embed(texts: string[]): Promise<Map<number, number[]>> {
    if (!texts.length) return new Map()

    // Filter out empty strings to prevent API errors
    const validTexts = texts.filter((text) => text.trim().length > 0)
    if (!validTexts.length) return new Map()

    const res = await this.openai.embeddings.create({
      model: this.model!,
      input: validTexts,
    })

    // Create a mapping that preserves the original indices
    const resultMap = new Map<number, number[]>()
    let validIndex = 0

    texts.forEach((text, originalIndex) => {
      if (text.trim().length > 0) {
        // Add null check to avoid possible undefined error
        const embedding = res.data[validIndex]?.embedding || []
        resultMap.set(originalIndex, embedding)
        validIndex++
      } else {
        // For empty texts, use an empty array as embedding
        resultMap.set(originalIndex, [])
      }
    })

    return resultMap
  }

  async embedChunks(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]> {
    const texts = chunks.map((chunk) => chunk.content.trim())
    const embeddings = await this.embed(texts)

    return chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings.get(i)!,
    }))
  }
}
