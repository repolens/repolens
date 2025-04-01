export interface Fetcher<T = any> {
  fetch(opts: T): Promise<RepoLensFile[]>
}

export interface RepoLensFile {
  content: string
  metadata?: {
    name?: string // file.ts, README.md, etc
    path?: string // optional full path
    sha?: string // optional if from GitHub
    [key: string]: any // extensible metadata
  }
}

export interface FetchedFile {
  path: string
  name: string
  repo: string
  owner: string
  content: string
  sha: string
}
