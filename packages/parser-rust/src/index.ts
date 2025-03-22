import Parser from 'tree-sitter'
import Rust from 'tree-sitter-rust'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const parser = new Parser()
  parser.setLanguage(Rust as unknown as Parser.Language)

  const tree = parser.parse(content)
  const root = tree.rootNode

  const chunks: ParsedChunk[] = []

  root.descendantsOfType('function_item').forEach((fn) => {
    const name = fn.childForFieldName('name')?.text || 'anonymous'
    chunks.push({
      type: 'function',
      name,
      text: content.slice(fn.startIndex, fn.endIndex),
    })
  })

  root.descendantsOfType('struct_item').forEach((st) => {
    const name = st.childForFieldName('name')?.text || 'anonymous'
    chunks.push({
      type: 'struct',
      name,
      text: content.slice(st.startIndex, st.endIndex),
    })
  })

  return chunks
}
