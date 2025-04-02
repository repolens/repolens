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
            const text = node.children
              .map((c: any) => {
                if (c.type === 'text') return c.value ?? ''
                if (c.type === 'link')
                  return `[${c.children[0].value}](${c.url})`
                if (c.type === 'strong') return `**${c.children[0].value}**`
                if (c.type === 'emphasis') return `_${c.children[0].value}_`
                if (c.type === 'image') return `![${c.alt}](${c.url})`
                return ''
              })
              .join('')
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

          if (node.type === 'table') {
            // Convert table to markdown table string
            const tableRows = (node.children as any[]).map((row) => {
              return row.children
                .map((cell: any) => {
                  return cell.children?.[0]?.value ?? ''
                })
                .join(' | ')
            })

            // Add separator row after header
            tableRows.splice(1, 0, tableRows[0].replace(/[^|]/g, '-'))

            const tableContent = tableRows.map((row) => `| ${row} |`).join('\n')

            chunks.push({
              content: tableContent,
              metadata: {
                ...baseMeta,
                type: 'table',
                part: part++,
              },
            })
          }

          if (node.type === 'blockquote') {
            const text = (node.children as any[])
              .map((child) => {
                if (child.type === 'paragraph') {
                  return child.children
                    .map((c: any) => {
                      if (c.type === 'emphasis')
                        return `_${c.children[0].value}_`
                      return c.value ?? ''
                    })
                    .join('')
                }
                return ''
              })
              .filter(Boolean)
              .map((line) => `> ${line}`)
              .join('\n')

            chunks.push({
              content: text,
              metadata: { ...baseMeta, type: 'blockquote', part: part++ },
            })
          }

          if (node.type === 'list') {
            const items = (node.children as any[]).map((item) => {
              const checked = item.checked
              const text = item.children
                .map((child: any) => {
                  if (child.type === 'paragraph' || child.type === 'text') {
                    return (
                      child.children
                        ?.map((c: any) => {
                          if (c.type === 'link') {
                            return `[${c.children[0].value}](${c.url})`
                          }
                          if (c.type === 'strong')
                            return `**${c.children[0].value}**`
                          if (c.type === 'emphasis')
                            return `_${c.children[0].value}_`
                          return c.value
                        })
                        .join('') ?? ''
                    )
                  }
                  return ''
                })
                .join('')

              // Handle task lists (checked/unchecked boxes)
              if (checked !== undefined) {
                return `- [${checked ? 'x' : ' '}] ${text}`
              }
              return `- ${text}`
            })

            chunks.push({
              content: items.join('\n'),
              metadata: {
                ...baseMeta,
                type: node.children.some(
                  (item: any) => item.checked !== undefined
                )
                  ? 'task-list'
                  : 'list',
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
