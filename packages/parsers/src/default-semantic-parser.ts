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

  parse(files: LensData[]): ParsedChunk[] {
    const all: ParsedChunk[] = []
    const grouped = new Map<SemanticParser, LensData[]>()

    for (const file of files) {
      const ext =
        (file.metadata?.path as string).split('.').pop()?.toLowerCase() ?? ''
      const parser = this.registry.get(ext) ?? this.fallback
      const current = grouped.get(parser) ?? []
      current.push(file)
      grouped.set(parser, current)
    }

    for (const [parser, group] of grouped.entries()) {
      const parsed = parser.parse(group)
      all.push(...parsed)
    }

    return all
  }
}
