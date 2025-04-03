import { SemanticParser } from '@repolens/core'
import type { LensData, ParsedChunk } from '@repolens/core'
import { createTSParser } from './parsers/typescript.js'
import { createMarkdownParser } from './parsers/markdown.js'
import { createDefaultParser } from './parsers/default.js'

export class DefaultSemanticParser extends SemanticParser {
  private readonly registry = new Map<string, SemanticParser>()
  private readonly fallback: SemanticParser

  constructor(maxTokens = 8000) {
    super(maxTokens)
    this.fallback = createDefaultParser(maxTokens)
    this.register(['ts', 'tsx', 'js', 'jsx'], createTSParser(maxTokens))
    this.register(['md', 'markdown'], createMarkdownParser(maxTokens))
  }

  register(exts: string | string[], parser: SemanticParser) {
    const extensions = Array.isArray(exts) ? exts : [exts]
    extensions.forEach((ext) => this.registry.set(ext.toLowerCase(), parser))
  }

  supports(_file: LensData): boolean {
    return true
  }

  private parseWithFallback(
    parser: SemanticParser,
    files: LensData[],
    isFallback = false
  ): ParsedChunk[] {
    // Skip empty file groups
    if (files.length === 0) return []

    // Try batch parsing first for efficiency
    try {
      return parser.parse(files)
    } catch (error) {
      // If already using fallback parser, we can't do anything more
      if (isFallback) {
        console.warn(
          `Fallback parser failed to parse ${files.length} file(s):`,
          error
        )
        return []
      }

      // For batches with multiple files, try to isolate failures
      if (files.length > 1) {
        console.warn(
          `Parser failed for batch of ${files.length} files, dividing batch`
        )

        // Divide batch in half for recursive processing
        const midpoint = Math.floor(files.length / 2)
        const firstHalf = files.slice(0, midpoint)
        const secondHalf = files.slice(midpoint)

        // Process each half recursively
        const firstResults = this.parseWithFallback(parser, firstHalf)
        const secondResults = this.parseWithFallback(parser, secondHalf)

        return [...firstResults, ...secondResults]
      } else {
        // Single file that failed with primary parser
        const file = files[0]
        if (!file) {
          console.warn('Empty file entry encountered')
          return []
        }

        const filePath = file.metadata?.path || 'unknown'
        console.warn(`Failed to parse file: ${filePath}`, error)

        // Try fallback parser for this file
        return this.parseWithFallback(this.fallback, files, true)
      }
    }
  }

  parse(files: LensData[]): ParsedChunk[] {
    const all: ParsedChunk[] = []
    const grouped = new Map<SemanticParser, LensData[]>()

    // Group files by their appropriate parser
    for (const file of files) {
      const ext =
        (file.metadata?.path as string).split('.').pop()?.toLowerCase() ?? ''
      const parser = this.registry.get(ext) ?? this.fallback
      const current = grouped.get(parser) ?? []
      current.push(file)
      grouped.set(parser, current)
    }

    // Process each parser group
    for (const [parser, group] of grouped.entries()) {
      const parsed = this.parseWithFallback(parser, group)
      all.push(...parsed)
    }

    return all
  }
}
