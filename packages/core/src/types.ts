import { ParsedChunk } from '@repolens/types/parser'

export interface RepoLensConfig {
  owner: string
  repo: string
  ref?: string
  githubToken?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  includeExtensions?: string[]
  excludePaths?: string[]
  excludeRegex?: RegExp[]
}

export interface RepoLensChunk extends ParsedChunk {
  repo: string
  embedding?: number[]
}
