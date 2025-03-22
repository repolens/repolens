import { parseFragment } from 'parse5'

export interface ParsedChunk {
  type: string
  name: string
  text: string
}

export function parse(content: string): ParsedChunk[] {
  const fragment = parseFragment(content)
  const chunks: ParsedChunk[] = []

  const visit = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.nodeName && node.tagName) {
        chunks.push({
          type: 'tag',
          name: node.tagName,
          text: node.outerHTML || '', // not always present
        })
      }
      if (node.childNodes) visit(node.childNodes)
    }
  }

  visit(fragment.childNodes)
  return chunks
}
