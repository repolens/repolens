import { encode, decode } from 'gpt-tokenizer'
import type { ParsedChunk } from '../types/parser.js'

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
  const result: ParsedChunk[] = []
  let buffer: string[] = []
  let metadataBuffer: Record<string, unknown>[] = []
  let tokenCount = 0
  let part = 0

  const flush = () => {
    if (!buffer.length) return
    result.push({
      content: buffer.join('\n\n'),
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
    const tokens = encode(chunk.content).length
    if (tokenCount + tokens > maxTokens) flush()
    buffer.push(chunk.content)
    metadataBuffer.push(chunk.metadata)
    tokenCount += tokens
  }

  flush()
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
  if (tokens.length <= tokenLimit) return [text]

  const chunks: string[] = []
  let start = 0

  while (start < tokens.length) {
    const end = Math.min(start + tokenLimit, tokens.length)
    const slice = tokens.slice(start, end)
    chunks.push(decode(slice))
    start += tokenLimit - overlap
  }

  return chunks
}
