import Parser from 'tree-sitter'
import Java from 'tree-sitter-java'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const parser = new Parser()
  parser.setLanguage(Java as Parser.Language)

  const tree = parser.parse(content)
  const root = tree.rootNode

  const chunks: ParsedChunk[] = []

  root.descendantsOfType('method_declaration').forEach((method) => {
    const name = method.childForFieldName('name')?.text || 'anonymous'
    chunks.push({
      type: 'method',
      name,
      text: content.slice(method.startIndex, method.endIndex),
    })
  })

  root.descendantsOfType('class_declaration').forEach((cls) => {
    const name = cls.childForFieldName('name')?.text || 'anonymous'
    chunks.push({
      type: 'class',
      name,
      text: content.slice(cls.startIndex, cls.endIndex),
    })
  })

  return chunks
}
