import OpenAI from 'openai'
import { encode, decode } from 'gpt-tokenizer'
import type { EmbeddedChunk, Embedder, ParsedChunk } from '@repolens/types'
import { getOpenaiConfig } from '@repolens/config'

export interface EmbedderOptions {
  model?:
    | 'text-embedding-3-small'
    | 'text-embedding-3-large'
    | 'text-embedding-ada-002'
}

export class OpenAIEmbedder implements Embedder {
  private openai: OpenAI
  private model:
    | 'text-embedding-3-small'
    | 'text-embedding-3-large'
    | 'text-embedding-ada-002'

  constructor(options?: EmbedderOptions) {
    this.openai = new OpenAI({
      apiKey: getOpenaiConfig().OPENAI_API_KEY,
      baseURL: getOpenaiConfig().OPENAI_BASE_URL,
    })

    this.model = options?.model ?? 'text-embedding-3-small'
  }

  async embed(texts: string[]): Promise<Map<number, number[]>> {
    const inputMap: [number, string][] = []

    texts.forEach((text, i) => {
      if (typeof text !== 'string') return
      const clean = text.trim()
      if (clean.length === 0) return
      const tokenCount = encode(clean).length
      if (tokenCount <= 8192) inputMap.push([i, clean])
    })

    const batches: [number, string][][] = []
    let currentBatch: [number, string][] = []
    let currentTokens = 0

    for (const [index, text] of inputMap) {
      const tokens = encode(text)
      if (currentTokens + tokens.length > 8192) {
        batches.push(currentBatch)
        currentBatch = []
        currentTokens = 0
      }
      currentBatch.push([index, text])
      currentTokens += tokens.length
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch)
    }

    const resultMap = new Map<number, number[]>()

    for (const [i, batch] of batches.entries()) {
      const inputs = batch.map(([, text]) => text)
      const indices = batch.map(([idx]) => idx)

      try {
        const res = await this.openai.embeddings.create({
          model: this.model,
          input: inputs,
        })

        res.data.forEach((d, j) => {
          resultMap.set(indices[j]!, d.embedding)
        })

        console.log(`✅ Embedded batch ${i + 1}/${batches.length}`)
      } catch (err: any) {
        console.error(`❌ Failed batch ${i + 1}:`, err.message)
        throw err
      }
    }

    return resultMap
  }

  async embedChunks(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]> {
    const texts = chunks.map((chunk) => chunk.content)
    const embeddings = await this.embed(texts)

    return chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings.get(i)!,
    }))
  }

  generateEmbeddableChunks(
    text: string,
    tokenLimit = 8192,
    overlap = 0
  ): string[] {
    const tokens = encode(text)

    if (tokens.length <= tokenLimit) {
      return [text]
    }

    const chunks: string[] = []
    let start = 0

    while (start < tokens.length) {
      const end = Math.min(start + tokenLimit, tokens.length)
      const slice = tokens.slice(start, end)
      const chunkText = decode(slice)
      chunks.push(chunkText)
      start += tokenLimit - overlap
    }

    return chunks
  }
}
