import type { Parser, ParsedChunk } from '@repolens/types/parser'
import type { Chunker } from '@repolens/types/chunker'
import type { FetchedFile } from '@repolens/types/fetcher'

export function createDefaultParser(chunker: Chunker): Parser {
  return {
    parse(file: FetchedFile): ParsedChunk[] {
      return chunker.chunk([
        {
          text: file.content,
          metadata: {
            file: {
              path: file.path,
              name: file.name,
              sha: file.sha,
            },
            part: 0,
            parserType: 'default',
          },
        },
      ])
    },
  }
}
