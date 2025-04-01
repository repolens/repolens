import type {
  RepoLensFile,
  Parser,
  ParsedChunk,
  Chunker,
} from '@repolens/types'
import { createDefaultParser } from './parsers/default.js'
import { createTSParser } from './parsers/typescript.js'

export class RepoLensParser implements Parser {
  private parsers: Parser[] = []
  protected fallback: Parser

  constructor(chunker: Chunker) {
    this.fallback = createDefaultParser(chunker)
    this.register(createTSParser(chunker))
  }

  register(parser: Parser) {
    this.parsers.push(parser)
  }

  supports(_file: RepoLensFile) {
    return true
  }

  parse(files: RepoLensFile[]) {
    const allChunks: ParsedChunk[] = []
    const grouped = new Map<Parser, RepoLensFile[]>()

    for (const file of files) {
      const parser =
        this.parsers.find((p) => p.supports?.(file)) ?? this.fallback
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
