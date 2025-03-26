import { GitHubFetcher } from '@repo-vector/github-fetcher'
import { Parser } from '@repo-vector/parser'
import { createDefaultParser } from '@repo-vector/parser-default'
import { Vectorizer } from '@repo-vector/vectorizer'
import type { ParsedChunk, Chunker } from '@repo-vector/types'

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
    const {
      owner,
      repo,
      ref,
      githubToken,
      openaiApiKey,
      openaiBaseUrl,
      includeExtensions,
      excludePaths,
      excludeRegex,
    } = this.config

    const fetcher = new GitHubFetcher({ token: githubToken })
    const treeEntries = await fetcher.getFilteredTreePaths(owner, repo, ref)

    const filteredTree = treeEntries.filter((entry) => {
      const ext = entry.path.split('.').pop()?.toLowerCase()
      const isIncluded = !includeExtensions || includeExtensions.includes(ext!)
      const isExcluded =
        excludePaths?.some((p) => entry.path.startsWith(p)) ||
        excludeRegex?.some((re) => re.test(entry.path))
      return isIncluded && !isExcluded
    })

    const includePaths = new Set(filteredTree.map((f) => f.path))
    const shaMap = new Map(filteredTree.map((f) => [f.path, f.sha]))

    const files = await fetcher.getFilesFromTarball(
      owner,
      repo,
      ref,
      includePaths
    )

    const filesWithSha = files.map((file) => ({
      ...file,
      sha: shaMap.get(file.path) || '',
    }))

    const filtered = this.filterFiles(filesWithSha)

    const vectorizer = new Vectorizer({
      apiKey: openaiApiKey,
      baseUrl: openaiBaseUrl,
    })

    const chunker: Chunker = {
      chunk: (text) => vectorizer.generateEmbeddableChunks(text, 8000, 0),
    }

    const parser = new Parser({
      fallback: createDefaultParser(chunker),
    })

    const chunks: RepoVectorChunk[] = []

    for (const file of filtered) {
      const parsed = parser.parse(file)
      parsed.forEach((chunk) => {
        chunks.push({
          ...chunk,
          filePath: file.path,
          repo: `${owner}/${repo}`,
        })
      })
    }

    const splitChunks: RepoVectorChunk[] = []
    const texts: string[] = []

    chunks.forEach((chunk) => {
      const parts = vectorizer.generateEmbeddableChunks(chunk.text, 8000, 0)
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
