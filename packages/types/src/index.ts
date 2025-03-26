export interface Chunker {
  chunk(text: string, options?: { path?: string }): string[]
}

export interface ChunkerOptions {
  path?: string
}

export interface ParsedChunk {
  type: string
  name: string
  parent?: string
  text: string
  path?: string
  language?: string
  embedding?: number[]
  metadata?: Record<string, any>
}

export interface FileInput {
  path: string
  content: string
}
