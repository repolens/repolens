import { RepoLensParser } from '@repolens/parsers'
import { OpenAITokenChunker } from '@repolens/chunkers/openai'

export async function POST(req: Request) {
  const { content, extension } = await req.json()

  const chunker = new OpenAITokenChunker(8000, 200)
  const parser = new RepoLensParser()

  const parsed = parser.parse([
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
  const chunks = chunker.chunk(parsed)

  return new Response(JSON.stringify(chunks))
}
