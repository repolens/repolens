import OpenAI from 'openai'
import { encoding_for_model } from '@dqbd/tiktoken'
export interface VectorizerOptions {
  apiKey?: string
  baseUrl?: string
  model?:
    | 'text-embedding-3-small'
    | 'text-embedding-3-large'
    | 'text-embedding-ada-002'
}

export class Vectorizer {
  private openai: OpenAI
  private model:
    | 'text-embedding-3-small'
    | 'text-embedding-3-large'
    | 'text-embedding-ada-002'

  constructor(options: VectorizerOptions) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('Missing OpenAI API Key')
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: options.baseUrl, // support for proxy / self-hosted baseUrl
    })

    this.model = options.model || 'text-embedding-3-small'
  }

  async embed(texts: string[]): Promise<Map<number, number[]>> {
    const enc = encoding_for_model(this.model)
    const inputMap: [number, string][] = []

    // keep original indexes!
    texts.forEach((text, i) => {
      if (typeof text !== 'string') return
      const clean = text.trim()
      if (clean.length === 0) return
      const tokenCount = enc.encode(clean).length
      if (tokenCount <= 8192) inputMap.push([i, clean])
    })

    const batches: [number, string][][] = []
    let currentBatch: [number, string][] = []
    let currentTokens = 0

    for (const [index, text] of inputMap) {
      const tokens = enc.encode(text).length
      if (currentTokens + tokens > 8192) {
        batches.push(currentBatch)
        currentBatch = []
        currentTokens = 0
      }
      currentBatch.push([index, text])
      currentTokens += tokens
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch)
    }

    enc.free()

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
}
