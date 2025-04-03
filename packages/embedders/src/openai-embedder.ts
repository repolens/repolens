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

    const res = await this.openai.embeddings.create({
      model: this.model!,
      input: texts,
    })

    const resultMap = new Map<number, number[]>()
    res.data.forEach((item, i) => {
      resultMap.set(i, item.embedding)
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
