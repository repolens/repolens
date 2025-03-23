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
import {
  parse as parseTOML,
  type ParsedChunk as ParsedChunkTOML,
} from '@repo-vector/parser-toml'
import {
  parse as parseJava,
  type ParsedChunk as ParsedChunkJava,
} from '@repo-vector/parser-java'
import {
  parse as parseKotlin,
  type ParsedChunk as ParsedChunkKotlin,
} from '@repo-vector/parser-kotlin'
import {
  parse as parsePHP,
  type ParsedChunk as ParsedChunkPHP,
} from '@repo-vector/parser-php'
import {
  parse as parseCPP,
  type ParsedChunk as ParsedChunkCPP,
} from '@repo-vector/parser-cpp'
import {
  parse as parseGo,
  type ParsedChunk as ParsedChunkGo,
} from '@repo-vector/parser-go'
import {
  parse as parseRuby,
  type ParsedChunk as ParsedChunkRuby,
} from '@repo-vector/parser-ruby'

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
    case 'scss':
    case 'sass':
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

    case 'rb':
      return parseRuby(content).map((chunk: ParsedChunkRuby) => ({
        ...chunk,
        path,
        language: 'ruby',
      }))

    case 'html':
      return parseHTML(content).map((chunk: ParsedChunkHTML) => ({
        ...chunk,
        path,
        language: 'html',
      }))

    case 'toml':
      return parseTOML(content).map((chunk: ParsedChunkTOML) => ({
        ...chunk,
        path,
        language: 'toml',
      }))

    case 'java':
      return parseJava(content).map((chunk: ParsedChunkJava) => ({
        ...chunk,
        path,
        language: 'java',
      }))

    case 'kt':
      return parseKotlin(content).map((chunk: ParsedChunkKotlin) => ({
        ...chunk,
        path,
        language: 'kotlin',
      }))

    case 'php':
      return parsePHP(content).map((chunk: ParsedChunkPHP) => ({
        ...chunk,
        path,
        language: 'php',
      }))

    case 'c':
    case 'cpp':
    case 'cc':
    case 'cxx':
      return parseCPP(content).map((chunk: ParsedChunkCPP) => ({
        ...chunk,
        path,
        language: 'cpp',
      }))

    case 'go':
      return parseGo(content).map((chunk: ParsedChunkGo) => ({
        ...chunk,
        path,
        language: 'go',
      }))

    default:
      return [] // unsupported file
  }
}
