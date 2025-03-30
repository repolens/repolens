export interface Fetcher<T = any> {
  fetch(opts: T): Promise<FetchedFile[]>
}

export interface FetchedFile {
  path: string
  name: string
  repo: string
  owner: string
  content: string
  sha: string
}
