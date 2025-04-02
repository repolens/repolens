import { GithubLens } from '@repolens/core'

export async function runGithubLens() {
  const lens = new GithubLens({
    owner: 'repolens',
    repo: 'repolens',
    ref: 'main',
  })
  const chunks = await lens.run()

  return chunks.map((chunk) => ({
    content: chunk.content,
    metadata: chunk.metadata,
  }))
}
