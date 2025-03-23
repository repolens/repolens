import Parser from 'tree-sitter'
import Kotlin from 'tree-sitter-kotlin'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const parser = new Parser()
  parser.setLanguage(Kotlin as Parser.Language)

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
