import { RepoLensFile } from './file.js'

export interface Fetcher<T = any> {
  fetch(opts: T): Promise<RepoLensFile[]>
}
