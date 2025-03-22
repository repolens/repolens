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
import {
  parse as parseCSS,
  type ParsedChunk as ParsedChunkCSS,
} from '@repo-vector/parser-css'
import {
  parse as parseYAML,
  type ParsedChunk as ParsedChunkYAML,
} from '@repo-vector/parser-yaml'
import {
  parse as parsePY,
  type ParsedChunk as ParsedChunkPY,
} from '@repo-vector/parser-py'
import {
  parse as parseRust,
  type ParsedChunk as ParsedChunkRust,
} from '@repo-vector/parser-rust'
import {
  parse as parseHTML,
  type ParsedChunk as ParsedChunkHTML,
} from '@repo-vector/parser-html'

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
    case 'js':
    case 'jsx':
    case 'tsx':
      return parseTS(content, ext).map((chunk: ParsedChunkTS) => ({
        ...chunk,
        path,
        language: ext,
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

    case 'css':
      return parseCSS(content).map((chunk: ParsedChunkCSS) => ({
        ...chunk,
        path,
        language: 'css',
      }))

    case 'yaml':
    case 'yml':
      return parseYAML(content).map((chunk: ParsedChunkYAML) => ({
        ...chunk,
        path,
        language: ext,
      }))

    case 'py':
      return parsePY(content).map((chunk: ParsedChunkPY) => ({
        ...chunk,
        path,
        language: 'python',
      }))

    case 'rs':
      return parseRust(content).map((chunk: ParsedChunkRust) => ({
        ...chunk,
        path,
        language: 'rust',
      }))

    case 'html':
      return parseHTML(content).map((chunk: ParsedChunkHTML) => ({
        ...chunk,
        path,
        language: 'html',
      }))

    default:
      return [] // unsupported file
  }
}
