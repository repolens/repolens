import type { ParsedChunk, Parser } from '@repolens/types/parser'
import type { FetchedFile } from '@repolens/types/fetcher'

export class ParserManager {
  private registry = new Map<string, Parser>()

  constructor(private options: { fallback: Parser }) {}

  register(ext: string | string[], parser: Parser) {
    const extensions = Array.isArray(ext) ? ext : [ext]
    extensions.forEach((e) => this.registry.set(e, parser))
  }

  parse(file: FetchedFile): ParsedChunk[] {
    const ext = file.name.split('.').pop() ?? ''
    const parser = this.registry.get(ext) ?? this.options.fallback
    return parser.parse(file)
  }
}
