import { Chunker } from './chunker.js'
import { Embedder } from './embedder.js'
import { Fetcher } from './fetcher.js'
import { ParsedChunk } from './chunk.js'
import { Parser } from './parser.js'

export interface RepoLensConfig {
  parser?: Parser
  embedder?: Embedder
  chunker?: Chunker
  fetcher?: Fetcher
}

export interface RepoLensChunk extends ParsedChunk {
  repo: string
  embedding?: number[]
}
