import type { Parser, ParsedChunk } from '@repolens/types/parser'
import type { Chunker } from '@repolens/types/chunker'
import type { FetchedFile } from '@repolens/types/fetcher'

export function createDefaultParser(chunker: Chunker): Parser {
  return {
    parse(files: FetchedFile[]): ParsedChunk[] {
      return chunker.chunk(
        files.map((file) => ({
          text: file.content,
          metadata: {
            file: {
              path: file.path,
              name: file.name,
              sha: file.sha,
              repo: file.repo,
              owner: file.owner,
            },
            part: 0,
            parserType: 'default',
          },
        }))
      )
    },
  }
}
