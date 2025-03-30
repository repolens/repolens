import type { ParsedChunk, Parser } from '@repolens/types/parser'
import type { FetchedFile } from '@repolens/types/fetcher'
import { Chunker } from '@repolens/types/chunker'
import { createDefaultParser } from './parsers/default.js'
import { createTSParser } from './parsers/typescript.js'

export class RepoLensParser implements Parser {
  private registry = new Map<string, Parser>()
  protected fallback: Parser

  constructor(chunker: Chunker) {
    this.fallback = createDefaultParser(chunker)
    this.register(['ts', 'tsx', 'js', 'jsx'], createTSParser(chunker))
  }

  register(ext: string | string[], parser: Parser) {
    const extensions = Array.isArray(ext) ? ext : [ext]
    extensions.forEach((e) => this.registry.set(e, parser))
  }

  parse(files: FetchedFile[]) {
    const allChunks: ParsedChunk[] = []
    const grouped = new Map<Parser, FetchedFile[]>()

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const parser = this.registry.get(ext) ?? this.fallback
      const current = grouped.get(parser) ?? []
      current.push(file)
      grouped.set(parser, current)
    }

    for (const [parser, group] of grouped.entries()) {
      const chunks = parser.parse(group)
      allChunks.push(...chunks)
    }

    return allChunks
  }
}
