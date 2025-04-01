import type { Parser, ParsedChunk } from '@repolens/types/parser'
import type { Chunker } from '@repolens/types/chunker'
import type { RepoLensFile } from '@repolens/types/fetcher'

export function createDefaultParser(chunker: Chunker): Parser {
  return {
    supports: () => true,
    parse(files: RepoLensFile[]): ParsedChunk[] {
      return chunker.chunk(
        files.map(({ content, metadata }) => ({
          content,
          metadata: {
            ...metadata,
            part: 0,
            parserType: 'default',
          },
        }))
      )
    },
  }
}
