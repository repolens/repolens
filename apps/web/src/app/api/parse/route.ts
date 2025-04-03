import { DefaultSemanticParser } from '@repolens/parsers'

export async function POST(req: Request) {
  const { content, extension } = await req.json()

  const parser = new DefaultSemanticParser()

  const parsedChunks = parser.parse([
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

  return new Response(JSON.stringify(parsedChunks))
}
