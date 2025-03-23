import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken'

const DEFAULT_TOKEN_LIMIT = 8000

export function splitChunkText(
  text: string,
  model: string = 'text-embedding-3-small',
  tokenLimit = DEFAULT_TOKEN_LIMIT
): string[] {
  const enc = encoding_for_model(model as TiktokenModel)
  const tokens = enc.encode(text)

  if (tokens.length <= tokenLimit) {
    enc.free()
    return [text]
  }

  const result: string[] = []
  const decoder = new TextDecoder()
  let start = 0

  while (start < tokens.length) {
    const rawSlice = tokens.slice(start, start + tokenLimit)
    const decodedBytes = enc.decode(rawSlice)
    const decodedString = decoder.decode(decodedBytes)
    result.push(decodedString)
    start += tokenLimit
  }

  enc.free()
  return result
}
