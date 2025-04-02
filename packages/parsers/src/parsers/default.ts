import type { Parser, ParsedChunk, RepoLensFile } from '@repolens/types'

export function createDefaultParser(): Parser {
  return {
    name: 'default',
    supports: () => true,
    parse(files: RepoLensFile[]): ParsedChunk[] {
      return files.map(({ content, metadata }) => ({
        content,
        metadata: {
          ...metadata,
          part: 0,
          parserType: 'default',
        },
      }))
    },
  }
}
