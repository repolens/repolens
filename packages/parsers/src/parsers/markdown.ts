// packages/parsers/src/createMarkdownParser.ts

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import type { Parser, ParsedChunk, LensData } from '@repolens/types'

export function createMarkdownParser(): Parser {
  return {
    name: 'markdown',
    supports: (file: LensData) => {
      const name = file.metadata?.name ?? ''
      return /\.md$|\.markdown$|\.mdx$/.test(name)
    },

    parse(files: LensData[]): ParsedChunk[] {
      const chunks: ParsedChunk[] = []

      console.log('FILES: ', files)
      for (const file of files) {
        const tree = unified()
          .use(remarkParse)
          .use(remarkFrontmatter)
          .use(remarkGfm)
          .use(remarkMdx)
          .parse(file.content)

        const baseMeta = {
          ...file.metadata,
          parserType: 'markdown' as const,
        }

        let part = 0

        visit(tree, (node) => {
          console.log('NODE: ', node)
          if (node.type === 'heading' && 'children' in node) {
            const text = node.children.map((c: any) => c.value).join('')
            if (text.trim()) {
              chunks.push({
                content: text,
                metadata: {
                  ...baseMeta,
                  type: 'heading',
                  depth: node.depth,
                  part: part++,
                },
              })
            }
          }

          if (node.type === 'paragraph' && 'children' in node) {
            const text = node.children.map((c: any) => c.value ?? '').join('')
            if (text.trim()) {
              chunks.push({
                content: text,
                metadata: { ...baseMeta, type: 'paragraph', part: part++ },
              })
            }
          }

          if (node.type === 'code') {
            chunks.push({
              content: node.value,
              metadata: {
                ...baseMeta,
                type: 'code',
                language: node.lang ?? 'text',
                part: part++,
              },
            })
          }

          if (node.type === 'image') {
            chunks.push({
              content: node.alt ?? '',
              metadata: {
                ...baseMeta,
                type: 'image',
                format: node.url.startsWith('data:image/') ? 'base64' : 'url',
                src: node.url,
                alt: node.alt,
                part: part++,
              },
            })
          }
        })
      }

      return chunks
    },
  }
}
