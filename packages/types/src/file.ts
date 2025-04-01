export interface RepoLensFile {
  content: string
  metadata?: {
    name?: string // file.ts, README.md, etc
    path?: string // optional full path
    sha?: string // optional if from GitHub
    [key: string]: any // extensible metadata
  }
}
