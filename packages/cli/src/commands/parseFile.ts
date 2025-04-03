import fs from 'fs/promises'

import {
  createTSParser,
  createMarkdownParser,
  createDefaultParser,
} from '@repolens/parsers'
import { Parser } from '@repolens/core'

interface ParseOptions {
  parser: string
  output?: string
}

const parsers: Record<string, Parser> = {
  typescript: createTSParser(),
  markdown: createMarkdownParser(),
  default: createDefaultParser(),
}

export async function parseFile(filePath: string, options: ParseOptions) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')

    // Import parser dynamically based on option
    const parser = parsers[options.parser]
    if (!parser) {
      throw new Error(`Parser ${options.parser} not found`)
    }
    const parsed = parser.parse([
      {
        content,
        metadata: {
          name: filePath.split('/').pop(),
          path: filePath,
        },
      },
    ])

    if (options.output) {
      await fs.writeFile(options.output, JSON.stringify(parsed, null, 2))
      console.log(`Output written to ${options.output}`)
    } else {
      console.log(JSON.stringify(parsed, null, 2))
    }
  } catch (error) {
    console.error('Error parsing file:', error)
    process.exit(1)
  }
}
