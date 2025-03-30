export interface Fetcher<T = any> {
  fetch(opts: T): Promise<FetchedFile[]>
}

export interface FetchedFile {
  path: string
  name: string
  content: string
  sha: string
}
