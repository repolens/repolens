import { Parser } from '@repolens/parsers'
import { createDefaultParser } from '@repolens/parsers/default'
import { createTSParser } from '@repolens/parsers/typescript'
import { Vectorizer } from '@repolens/vectorizer'

export async function POST(req: Request) {
  const { content, extension } = await req.json()

  const vectorizer = new Vectorizer({
    apiKey: process.env.OPENAI_API_KEY!,
  })
  const parser = new Parser({
    fallback: createDefaultParser({
      chunk: (text) => vectorizer.generateEmbeddableChunks(text, 8000, 0),
    }),
  })

  parser.register(
    'ts',
    createTSParser({
      chunk: (text) => vectorizer.generateEmbeddableChunks(text, 8000, 0),
    })
  )

  const chunks = parser.parse({
    path: `file.${extension}`,
    content,
  })

  return new Response(JSON.stringify(chunks))
}
