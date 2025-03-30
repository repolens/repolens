import { FetchedFile } from './fetcher.js'

export interface Parser {
  parse(files: FetchedFile[]): ParsedChunk[]
}

export interface ParsedChunk {
  text: string
  metadata: ParsedChunkMetadata
}

export interface ParsedChunkMetadata {
  file: {
    path: string
    name: string
    sha: string
  }
  part: number
  parserType: string
  [key: string]: unknown
}

export interface TypeScriptChunkMetadata extends ParsedChunkMetadata {
  parserType: 'typescript'
  type:
    | 'function'
    | 'class'
    | 'method'
    | 'interface'
    | 'enum'
    | 'type'
    | 'variable'
    | 'import'
  name: string
  parent?: string
}

export function isTypeScriptChunk(
  metadata: ParsedChunkMetadata
): metadata is TypeScriptChunkMetadata {
  return metadata.parserType === 'typescript'
}

export function isDefaultChunk(
  metadata: ParsedChunkMetadata
): metadata is ParsedChunkMetadata & { parserType: 'default' } {
  return metadata.parserType === 'default'
}
