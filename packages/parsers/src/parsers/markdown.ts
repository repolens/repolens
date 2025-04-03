// packages/parsers/src/parsers/markdown.ts

import { SemanticParser } from '@repolens/core'
import type { ParsedChunk, LensData } from '@repolens/core'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import { visit, SKIP } from 'unist-util-visit'

export class MarkdownParser extends SemanticParser {
  supports(file: LensData): boolean {
    const name = file.metadata?.name as string | undefined
    return /\.md$|\.markdown$|\.mdx$/.test(name ?? '')
  }

  parse(files: LensData[]): ParsedChunk[] {
    const parsedChunks: ParsedChunk[] = []

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
      const processedNodes = new Set()
      const rawChunks: ParsedChunk[] = []

      visit(tree, (node, index, parent) => {
        // Skip if this node is already processed as part of a parent
        if (processedNodes.has(node)) {
          return SKIP
        }

        if (node.type === 'heading' && 'children' in node) {
          const text = node.children.map((c: any) => c.value).join('')
          if (text.trim()) {
            rawChunks.push({
              content: `${'#'.repeat(node.depth)} ${text}`,
              metadata: {
                ...baseMeta,
                type: 'heading',
                depth: node.depth,
                part: part++,
              },
            })
            // Mark children as processed
            node.children.forEach((child) => processedNodes.add(child))
          }
        }

        if (node.type === 'paragraph' && 'children' in node) {
          // Skip if this paragraph is part of a blockquote or list
          if (
            parent &&
            (parent.type === 'blockquote' || parent.type === 'listItem')
          ) {
            return
          }

          const text = node.children
            .map((c: any) => {
              if (c.type === 'text') return c.value ?? ''
              if (c.type === 'link') {
                // Handle badge images inside links
                const linkContent = c.children[0]
                if (linkContent.type === 'image') {
                  return `[![${linkContent.alt}](${linkContent.url})](${c.url})`
                }
                return `[${c.children[0].value}](${c.url})`
              }
              if (c.type === 'strong') return `**${c.children[0].value}**`
              if (c.type === 'emphasis') return `_${c.children[0].value}_`
              if (c.type === 'image') {
                // Store image in chunks separately for better RAG processing
                rawChunks.push({
                  content: c.alt ?? '',
                  metadata: {
                    ...baseMeta,
                    type: 'image',
                    format: c.url.startsWith('data:image/') ? 'base64' : 'url',
                    src: c.url,
                    alt: c.alt,
                    part: part++,
                  },
                })
                // Return markdown image syntax for the paragraph content
                return `![${c.alt}](${c.url})`
              }
              return ''
            })
            .join('')
          if (text.trim()) {
            rawChunks.push({
              content: text,
              metadata: { ...baseMeta, type: 'paragraph', part: part++ },
            })
            // Mark children as processed
            node.children.forEach((child) => processedNodes.add(child))
          }
        }

        if (node.type === 'code') {
          rawChunks.push({
            content: `\`\`\`${node.lang ?? ''}\n${node.value}\n\`\`\``,
            metadata: {
              ...baseMeta,
              type: 'code',
              language: node.lang ?? 'text',
              part: part++,
            },
          })
        }

        if (node.type === 'image' && (!parent || parent.type !== 'paragraph')) {
          rawChunks.push({
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
          const tableRows = (node.children as any[]).map((row) => {
            return row.children
              .map((cell: any) => {
                return cell.children?.[0]?.value ?? ''
              })
              .join(' | ')
          })

          tableRows.splice(1, 0, tableRows[0].replace(/[^|]/g, '-'))
          const tableContent = tableRows.map((row) => `| ${row} |`).join('\n')

          rawChunks.push({
            content: tableContent,
            metadata: {
              ...baseMeta,
              type: 'table',
              part: part++,
            },
          })
          // Mark all children as processed
          if ('children' in node) {
            node.children.forEach((row: any) => {
              processedNodes.add(row)
              if ('children' in row) {
                row.children?.forEach((cell: any) => {
                  processedNodes.add(cell)
                  if ('children' in cell) {
                    cell.children?.forEach((content: any) =>
                      processedNodes.add(content)
                    )
                  }
                })
              }
            })
          }
        }

        if (node.type === 'blockquote') {
          const text = (node.children as any[])
            .map((child) => {
              if (child.type === 'paragraph') {
                return child.children
                  .map((c: any) => {
                    if (c.type === 'text') return c.value ?? ''
                    if (c.type === 'link') {
                      // Handle badge images inside links
                      const linkContent = c.children[0]
                      if (linkContent.type === 'image') {
                        return `[![${linkContent.alt}](${linkContent.url})](${c.url})`
                      }
                      return `[${c.children[0].value}](${c.url})`
                    }
                    if (c.type === 'strong') return `**${c.children[0].value}**`
                    if (c.type === 'emphasis') return `_${c.children[0].value}_`
                    if (c.type === 'image') return `![${c.alt}](${c.url})`
                    return c.value ?? ''
                  })
                  .join('')
              }
              return ''
            })
            .filter(Boolean)
            .map((line) => `> ${line}`)
            .join('\n')

          rawChunks.push({
            content: text,
            metadata: { ...baseMeta, type: 'blockquote', part: part++ },
          })
          // Mark all children as processed
          if ('children' in node) {
            node.children.forEach((child) => {
              processedNodes.add(child)
              if ('children' in child) {
                child.children.forEach((grandChild: any) =>
                  processedNodes.add(grandChild)
                )
              }
            })
          }
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

          rawChunks.push({
            content: `\n${items.join('\n')}\n`,
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
          // Mark all children and their children as processed
          node.children.forEach((item: any) => {
            processedNodes.add(item)
            item.children?.forEach((child: any) => {
              processedNodes.add(child)
              child.children?.forEach((grandChild: any) =>
                processedNodes.add(grandChild)
              )
            })
          })
        }
      })

      parsedChunks.push(...this.mergeChunks(rawChunks, baseMeta, 'markdown'))
    }

    return parsedChunks
  }
}

export function createMarkdownParser(maxTokens: number = 8000) {
  return new MarkdownParser(maxTokens)
}
