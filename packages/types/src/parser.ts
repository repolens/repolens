import { ParsedChunk } from './chunk.js'
import type { LensData } from './data.js'

export interface Parser {
  name: string
  supports: (file: LensData) => boolean
  parse: (files: LensData[]) => ParsedChunk[]
}
