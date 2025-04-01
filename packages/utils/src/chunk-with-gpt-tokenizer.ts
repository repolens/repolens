import { encode, decode } from 'gpt-tokenizer'

export function chunkWithGPTTokenizer(
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
