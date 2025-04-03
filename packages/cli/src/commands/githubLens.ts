import { ParsedChunk } from '@repolens/core'
import { GitHubLens } from '@repolens/github-lens'

export async function runGithubLens(): Promise<ParsedChunk[]> {
  const lens = new GitHubLens({
    fetcherOptions: {
      owner: 'supabase',
      repo: 'supabase',
      ref: 'master',
    },
  })

  return await lens.run()
}
