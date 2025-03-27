export interface Fetcher<T = Record<string, unknown>> {
  fetch(opts: T): Promise<FetchedFile[]>
}

export interface FetchedFile {
  path: string
  name: string
  content: string
  sha: string
}
