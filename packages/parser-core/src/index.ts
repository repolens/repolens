import {
  parse as parseTS,
  type ParsedChunk as ParsedChunkTS,
} from '@repo-vector/parser-ts'
import {
  parse as parseMD,
  type ParsedChunk as ParsedChunkMD,
} from '@repo-vector/parser-md'
import {
  parse as parseJSON,
  type ParsedChunk as ParsedChunkJSON,
} from '@repo-vector/parser-json'

export interface ParsedChunk {
  type: string
  name: string
  text: string
  path?: string
  language: string
}

export function parseFile({
  path,
  content,
}: {
  path: string
  content: string
}): ParsedChunk[] {
  const ext = path.split('.').pop()

  switch (ext) {
    case 'ts':
    case 'tsx':
      return parseTS(content).map((chunk: ParsedChunkTS) => ({
        ...chunk,
        path,
        language: 'ts',
      }))

    case 'md':
      return parseMD(content).map((chunk: ParsedChunkMD) => ({
        ...chunk,
        path,
        language: 'markdown',
      }))

    case 'json':
      return parseJSON(content).map((chunk: ParsedChunkJSON) => ({
        ...chunk,
        path,
        language: 'json',
      }))

    // Add others as needed

    default:
      return [] // unsupported file
  }
}
