import postcss from 'postcss'
import safeParser from 'postcss-safe-parser'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const root = postcss().process(content, { parser: safeParser }).root
  const chunks: ParsedChunk[] = []

  root.walkRules((rule) => {
    chunks.push({
      type: 'css-rule',
      name: rule.selector,
      text: rule.toString(),
    })
  })

  return chunks
}
