import { ParserManager } from '@repolens/parsers'
import { createDefaultParser } from '@repolens/parsers/default'
import { createTSParser } from '@repolens/parsers/typescript'
import { TokenChunker } from '@repolens/chunkers/token'
import { OpenAIEmbedder } from '@repolens/embedders/openai'

export async function POST(req: Request) {
  const { content, extension } = await req.json()

  const embedder = new OpenAIEmbedder({
    apiKey: process.env.OPENAI_API_KEY!,
  })
  const chunker = new TokenChunker(embedder)
  const parser = new ParserManager({
    fallback: createDefaultParser(chunker),
  })

  parser.register(['ts', 'tsx', 'jsx', 'js'], createTSParser(chunker))

  const chunks = parser.parse({
    path: `path/to/file.${extension}`,
    content,
    name: `file.${extension}`,
    sha: '123',
  })

  return new Response(JSON.stringify(chunks))
}
