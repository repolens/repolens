import { Parser } from '@repo-vector/parser'
import { createDefaultParser } from '@repo-vector/parser-default'
import { createTSParser } from '@repo-vector/parser-ts'
import { Vectorizer } from '@repo-vector/vectorizer'

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
