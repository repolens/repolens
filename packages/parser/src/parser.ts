import type { FileInput, ParsedChunk } from '@repo-vector/types'

export type { FileInput, ParsedChunk }
export type ParserFn = (file: FileInput) => ParsedChunk[]

export interface ParserOptions {
  fallback?: ParserFn
  mode?: 'semantic' | 'fast' | 'hybrid'
}

export class Parser {
  private registry = new Map<string, ParserFn>()
  private fallback: ParserFn
  private mode: 'semantic' | 'fast' | 'hybrid'

  constructor(options: ParserOptions = {}) {
    this.fallback = options.fallback ?? (() => [])
    this.mode = options.mode ?? 'semantic'
  }

  register(ext: string, parser: ParserFn): void {
    this.registry.set(ext.toLowerCase(), parser)
  }

  parse(file: FileInput): ParsedChunk[] {
    const ext = file.path.split('.').pop()?.toLowerCase()

    if (this.mode === 'fast') {
      return this.fallback(file)
    }

    const parser = ext ? this.registry.get(ext) : undefined

    const baseChunks = parser ? parser(file) : this.fallback(file)

    return baseChunks.map((chunk) => ({
      ...chunk,
      path: file.path,
      language: ext || 'plain',
    }))
  }
}
