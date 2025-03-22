import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const tree = unified().use(remarkParse).parse(content)
  const chunks: ParsedChunk[] = []

  visit(tree, 'heading', (node: any) => {
    const text = node.children.map((child: any) => child.value).join('')
    chunks.push({ type: 'markdown-heading', name: text, text })
  })

  visit(tree, 'code', (node: any) => {
    chunks.push({
      type: 'markdown-code',
      name: node.lang || 'code',
      text: node.value,
    })
  })

  return chunks
}
