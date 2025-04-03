import type { LensData } from './data.js'

export interface Parser {
  supports(file: LensData): boolean
  parse(files: LensData[]): ParsedChunk[]
}

export interface ParsedChunk {
  content: string
  metadata: ParsedChunkMetadata
}

export interface ParsedChunkMetadata {
  parserType: string
  part?: number
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
