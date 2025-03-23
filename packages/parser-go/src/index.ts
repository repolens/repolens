import Parser from 'tree-sitter'
import Go from 'tree-sitter-go'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const parser = new Parser()
  parser.setLanguage(Go as Parser.Language)

  const tree = parser.parse(content)
  const root = tree.rootNode

  const chunks: ParsedChunk[] = []

  root.descendantsOfType('function_declaration').forEach((fn) => {
    const name = fn.childForFieldName('name')?.text || 'anonymous'
    chunks.push({
      type: 'function',
      name,
      text: content.slice(fn.startIndex, fn.endIndex),
    })
  })

  return chunks
}
