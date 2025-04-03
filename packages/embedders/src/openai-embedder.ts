import OpenAI from 'openai'
import type { EmbeddedChunk, Embedder, ParsedChunk } from '@repolens/core'
import { getOpenaiConfig } from '@repolens/config'
import { getTokenCount } from '@repolens/core'

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

    console.log(`[EMBEDDER] Embedding ${texts.length} texts`)

    // Check token counts for each text
    const textTokenCounts = texts.map((text) => ({
      length: text.length,
      tokens: getTokenCount(text),
    }))

    // Find any texts exceeding the token limit
    const overSizedTexts = textTokenCounts.filter((tc) => tc.tokens > 8192)
    if (overSizedTexts.length > 0) {
      console.error(
        `[EMBEDDER] ERROR: ${overSizedTexts.length} texts exceed the 8192 token limit!`
      )
      overSizedTexts.forEach((tc, idx) => {
        const textIndex = textTokenCounts.findIndex(
          (t) => t.tokens === tc.tokens
        )
        if (textIndex >= 0 && texts[textIndex]) {
          console.error(
            `[EMBEDDER] Text #${textIndex} has ${tc.tokens} tokens (${tc.length} chars)`
          )
          console.error(
            `[EMBEDDER] Preview: ${texts[textIndex].substring(0, 100)}...`
          )
        }
      })
    }

    // Log largest text
    const largestText = textTokenCounts.reduce(
      (max, curr) => (curr.tokens > max.tokens ? curr : max),
      { tokens: 0, length: 0 }
    )
    console.log(
      `[EMBEDDER] Largest text: ${largestText.tokens} tokens, ${largestText.length} chars`
    )

    // Filter out empty strings to prevent API errors
    const validTexts = texts.filter((text) => text.trim().length > 0)
    if (!validTexts.length) return new Map()

    try {
      console.log(
        `[EMBEDDER] Calling OpenAI API with ${validTexts.length} texts`
      )
      const res = await this.openai.embeddings.create({
        model: this.model!,
        input: validTexts,
      })
      console.log(`[EMBEDDER] Successfully received embeddings from OpenAI`)

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
    } catch (error: any) {
      console.error(`[EMBEDDER] OpenAI API error:`, error)
      if (
        error?.message &&
        typeof error.message === 'string' &&
        error.message.includes('maximum context length')
      ) {
        // Find the problematic text
        const errorMessage = error.message
        console.error(
          `[EMBEDDER] Token limit exceeded. Error message: ${errorMessage}`
        )

        // Log the largest texts that might be causing the issue
        const sortedTexts = [...textTokenCounts]
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 3)
        console.error(
          `[EMBEDDER] Largest texts that might be causing the issue:`
        )
        sortedTexts.forEach((tc, idx) => {
          const textIndex = textTokenCounts.findIndex(
            (t) => t.tokens === tc.tokens
          )
          if (textIndex !== -1 && texts[textIndex]) {
            console.error(
              `[EMBEDDER] Text #${textIndex}: ${tc.tokens} tokens, ${tc.length} chars`
            )
            console.error(
              `[EMBEDDER] Content preview: ${texts[textIndex].substring(0, 200)}...`
            )
          }
        })
      }
      throw error
    }
  }

  async embedChunks(chunks: ParsedChunk[]): Promise<EmbeddedChunk[]> {
    console.log(`[EMBEDDER] Processing ${chunks.length} chunks for embedding`)
    const texts = chunks.map((chunk) => chunk.content.trim())

    try {
      const embeddings = await this.embed(texts)
      return chunks.map((chunk, i) => ({
        ...chunk,
        embedding: embeddings.get(i) ?? [],
      }))
    } catch (error: any) {
      console.error(`[EMBEDDER] Error embedding chunks:`, error)

      // Log the problematic chunks with file info
      chunks.forEach((chunk, idx) => {
        const tokenCount = getTokenCount(chunk.content)
        if (tokenCount > 8000) {
          console.error(`[EMBEDDER] Large chunk #${idx}: ${tokenCount} tokens`)
          console.error(`[EMBEDDER] Metadata:`, chunk.metadata)
        }
      })

      throw error
    }
  }
}
