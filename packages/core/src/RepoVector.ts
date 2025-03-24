import { GithubFetcher } from '@repo-vector/github-fetcher'
import { parseFile, ParsedChunk } from '@repo-vector/parser-core'
import { Vectorizer } from './vectorize'
import { splitChunkText } from '@repo-vector/utils/splitChunkText'

export interface RepoVectorConfig {
  owner: string
  repo: string
  ref?: string
  githubToken?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  includeExtensions?: string[]
  excludePaths?: string[]
  excludeRegex?: RegExp[]
}

export interface RepoVectorChunk extends ParsedChunk {
  embedding?: number[]
  filePath: string
  repo: string
  part?: number
}

export class RepoVector {
  constructor(private config: RepoVectorConfig) {
    this.config.githubToken ||= process.env.GITHUB_TOKEN
    this.config.openaiApiKey ||= process.env.OPENAI_API_KEY
  }

  async run(): Promise<RepoVectorChunk[]> {
    const { owner, repo, ref, githubToken, openaiApiKey, openaiBaseUrl } =
      this.config

    const fetcher = new GithubFetcher({ token: githubToken })
    const files = await fetcher.getFilesFromTarball(owner, repo, ref)
    const filtered = this.filterFiles(files)

    const chunks: RepoVectorChunk[] = []

    for (const file of filtered) {
      const parsed = parseFile(file)
      parsed.forEach((chunk) => {
        chunks.push({
          ...chunk,
          filePath: file.path,
          repo: `${owner}/${repo}`,
        })
      })
    }

    const vectorizer = new Vectorizer({
      apiKey: openaiApiKey,
      baseUrl: openaiBaseUrl,
    })

    const splitChunks: RepoVectorChunk[] = []
    const texts: string[] = []

    chunks.forEach((chunk) => {
      const parts = splitChunkText(
        chunk.text,
        'text-embedding-3-small',
        8000,
        0
      )
      parts.forEach((partText, index) => {
        texts.push(partText)
        splitChunks.push({
          ...chunk,
          text: partText,
          part: parts.length > 1 ? index : undefined,
        })
      })
    })

    const embeddingMap = await vectorizer.embed(texts)

    return splitChunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddingMap.get(i),
    }))
  }

  private filterFiles(files: { path: string; content: string }[]) {
    const {
      includeExtensions,
      excludePaths = [],
      excludeRegex = [],
    } = this.config

    return files.filter((file) => {
      const ext = file.path.split('.').pop()?.toLowerCase()
      const path = file.path.toLowerCase()

      if (includeExtensions && !includeExtensions.includes(ext ?? ''))
        return false
      if (excludePaths.some((p) => path.startsWith(p))) return false
      if (excludeRegex.some((re) => re.test(file.path))) return false

      return true
    })
  }
}
