import { encode, decode } from 'gpt-tokenizer'
import type { ParsedChunk } from '../types/parser.js'

/**
 * Get the token count for a string using the GPT tokenizer
 */
export function getTokenCount(text: string): number {
  return encode(text).length
}

/**
 * Groups raw semantic chunks together up to a max token limit.
 * This preserves chunk ordering and avoids exceeding model limits.
 */
export function mergeChunksByTokenLimit(
  chunks: ParsedChunk[],
  maxTokens: number,
  baseMetadata: Record<string, unknown> = {},
  parserType: string
): ParsedChunk[] {
  console.log(
    `[TOKEN-UTILS] Merging ${chunks.length} chunks with max tokens: ${maxTokens}`
  )

  const result: ParsedChunk[] = []
  let buffer: string[] = []
  let metadataBuffer: Record<string, unknown>[] = []
  let tokenCount = 0
  let part = 0

  let largestChunk = { size: 0, index: -1, content: '' }

  const flush = () => {
    if (!buffer.length) return
    const content = buffer.join('\n\n')
    const finalTokenCount = getTokenCount(content)

    console.log(
      `[TOKEN-UTILS] Flushing buffer - Part: ${part}, Content length: ${content.length}, Token count: ${finalTokenCount}`
    )

    if (finalTokenCount > 8192) {
      console.warn(
        `[TOKEN-UTILS] WARNING: Chunk exceeds OpenAI's 8192 token limit! (${finalTokenCount} tokens)`
      )
      console.warn(`[TOKEN-UTILS] Chunk metadata:`, {
        part,
        size: content.length,
        types: metadataBuffer.map((m) => m.type).filter(Boolean),
      })
    }

    result.push({
      content,
      metadata: {
        ...baseMetadata,
        part: part++,
        merged: true,
        types: metadataBuffer.map((m) => m.type).filter(Boolean),
        parserType,
      },
    })
    buffer = []
    metadataBuffer = []
    tokenCount = 0
  }

  for (const chunk of chunks) {
    const tokens = getTokenCount(chunk.content)

    // Track largest chunk for debugging
    if (tokens > largestChunk.size) {
      largestChunk = {
        size: tokens,
        index: chunks.indexOf(chunk),
        content: chunk.content.substring(0, 100) + '...', // Just log the start
      }
    }

    if (tokens > maxTokens) {
      console.warn(
        `[TOKEN-UTILS] Individual chunk exceeds max token limit: ${tokens} > ${maxTokens}`
      )
      console.warn(`[TOKEN-UTILS] Chunk metadata:`, chunk.metadata)
    }

    if (tokenCount + tokens > maxTokens) {
      console.log(
        `[TOKEN-UTILS] Buffer would exceed token limit (current: ${tokenCount}, adding: ${tokens}, max: ${maxTokens})`
      )
      flush()
    }

    buffer.push(chunk.content)
    metadataBuffer.push(chunk.metadata)
    tokenCount += tokens
  }

  flush()

  console.log(
    `[TOKEN-UTILS] Finished merging. Result: ${result.length} chunks, Largest chunk: ${largestChunk.size} tokens`
  )
  if (largestChunk.size > 8192) {
    console.warn(
      `[TOKEN-UTILS] CRITICAL: Largest chunk (${largestChunk.size} tokens) exceeds OpenAI's 8192 token limit!`
    )
    console.warn(
      `[TOKEN-UTILS] This chunk begins with: ${largestChunk.content}`
    )
  }

  return result
}

/**
 * Splits a large block of text into smaller overlapping chunks based on token limits.
 */
export function splitTextByTokens(
  text: string,
  tokenLimit = 8192,
  overlap = 0
): string[] {
  const tokens = encode(text)
  const tokenCount = tokens.length

  console.log(
    `[TOKEN-UTILS] Splitting text by tokens - Text length: ${text.length}, Token count: ${tokenCount}, Limit: ${tokenLimit}`
  )

  if (tokenCount <= tokenLimit) {
    console.log(`[TOKEN-UTILS] Text within token limit, no splitting needed`)
    return [text]
  }

  const chunks: string[] = []
  let start = 0

  while (start < tokens.length) {
    const end = Math.min(start + tokenLimit, tokens.length)
    const slice = tokens.slice(start, end)
    const chunkText = decode(slice)
    chunks.push(chunkText)
    console.log(
      `[TOKEN-UTILS] Created chunk ${chunks.length} - Size: ${slice.length} tokens, Text length: ${chunkText.length}`
    )
    start += tokenLimit - overlap
  }

  console.log(
    `[TOKEN-UTILS] Split text into ${chunks.length} chunks with ${overlap} token overlap`
  )
  return chunks
}
