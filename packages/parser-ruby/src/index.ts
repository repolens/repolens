import Parser from 'tree-sitter'
import Ruby from 'tree-sitter-ruby'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const parser = new Parser()
  parser.setLanguage(Ruby as Parser.Language)

  const tree = parser.parse(content)
  const root = tree.rootNode

  const chunks: ParsedChunk[] = []

  root.descendantsOfType('method').forEach((method) => {
    const name = method.childForFieldName('name')?.text || 'anonymous'
    chunks.push({
      type: 'method',
      name,
      text: content.slice(method.startIndex, method.endIndex),
    })
  })

  root.descendantsOfType('class').forEach((cls) => {
    const name = cls.childForFieldName('name')?.text || 'anonymous'
    chunks.push({
      type: 'class',
      name,
      text: content.slice(cls.startIndex, cls.endIndex),
    })
  })

  return chunks
}
