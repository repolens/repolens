import { RepoLensParser } from '@repolens/parsers'
import { TokenChunker } from '@repolens/chunkers/token'
import { OpenAIEmbedder } from '@repolens/embedders/openai'

export async function POST(req: Request) {
  const { content, extension } = await req.json()

  const embedder = new OpenAIEmbedder()
  const chunker = new TokenChunker(embedder)
  const parser = new RepoLensParser(chunker)

  const chunks = parser.parse([
    {
      metadata: {
        path: `path/to/file.${extension}`,
        name: `file.${extension}`,
        repo: 'repo',
        owner: 'owner',
        sha: '123',
      },
      content,
    },
  ])

  return new Response(JSON.stringify(chunks))
}
