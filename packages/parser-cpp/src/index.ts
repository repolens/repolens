import Parser from 'tree-sitter'
import Cpp from 'tree-sitter-cpp'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const parser = new Parser()
  parser.setLanguage(Cpp as Parser.Language)

  const tree = parser.parse(content)
  const root = tree.rootNode

  const chunks: ParsedChunk[] = []

  root.descendantsOfType('function_definition').forEach((fn) => {
    const name = fn.childForFieldName('declarator')?.text || 'anonymous'
    chunks.push({
      type: 'function',
      name,
      text: content.slice(fn.startIndex, fn.endIndex),
    })
  })

  return chunks
}
