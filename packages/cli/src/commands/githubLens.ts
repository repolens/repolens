import { ParsedChunk } from '@repolens/core'
import { GitHubLens } from '@repolens/github-lens'

export async function runGithubLens(): Promise<ParsedChunk[]> {
  const lens = new GitHubLens({
    fetcherOptions: {
      owner: 'repolens',
      repo: 'playground',
      ref: 'main',
    },
  })
  const chunks = await lens.run()

  return chunks.map((chunk) => ({
    content: chunk.content,
    metadata: chunk.metadata,
  }))
}
