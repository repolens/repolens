import { RepoLensFile } from './file.js'

export interface Fetcher {
  fetch(): Promise<RepoLensFile[]>
}
