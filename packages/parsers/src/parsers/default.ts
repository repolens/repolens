import type {
  Parser,
  ParsedChunk,
  RepoLensFile,
  Chunker,
} from '@repolens/types'

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
