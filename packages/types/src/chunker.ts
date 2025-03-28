import { ParsedChunk } from './parser.js'

export interface Chunker {
  chunk(chunks: ParsedChunk[]): ParsedChunk[]
}
