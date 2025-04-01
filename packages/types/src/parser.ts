import { ParsedChunk } from './chunk.js'
import type { LensData } from './data.js'

export interface Parser {
  supports: (file: LensData) => boolean
  parse: (files: LensData[]) => ParsedChunk[]
}
