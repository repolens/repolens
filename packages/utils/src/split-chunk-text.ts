import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken'

export function splitChunkText(
  text: string,
  model: TiktokenModel = 'text-embedding-3-small',
  tokenLimit: number = 8000,
  overlap: number = 200
): string[] {
  const enc = encoding_for_model(model)
  const tokens = enc.encode(text)

  if (tokens.length <= tokenLimit) {
    enc.free()
    return [text]
  }

  const result: string[] = []
  const decoder = new TextDecoder()
  let start = 0

  while (start < tokens.length) {
    const end = Math.min(start + tokenLimit, tokens.length)
    const slice = tokens.slice(start, end)
    const decodedBytes = enc.decode(slice)
    const decodedText = decoder.decode(decodedBytes)
    result.push(decodedText)
    start += tokenLimit - overlap
  }

  enc.free()
  return result
}
