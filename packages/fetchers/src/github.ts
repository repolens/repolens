import { Octokit } from 'octokit'
import tar from 'tar-stream'
import gunzip from 'gunzip-maybe'
import { Readable } from 'node:stream'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import type { Fetcher, FetchedFile } from '@repolens/types/fetcher'
import { getGithubConfig } from '@repolens/config'

interface GithubFetcherOptions {
  owner: string
  repo: string
  ref?: string
  token?: string
  includePaths?: Set<string>
}

export class GitHubFetcher implements Fetcher<GithubFetcherOptions> {
  private readonly owner: string
  private readonly repo: string
  private readonly ref: string
  private readonly includePaths: Set<string>
  private readonly token: string
  private readonly octokit: Octokit

  constructor(options: GithubFetcherOptions) {
    const { owner, repo, ref, token, includePaths } = options
    this.owner = owner
    this.repo = repo
    this.ref = ref ?? 'main'
    this.includePaths = includePaths ?? new Set()
    this.token = token ?? getGithubConfig().GITHUB_TOKEN
    this.octokit = new Octokit({ auth: this.token })
  }

  async fetch(): Promise<FetchedFile[]> {
    return await this.getFilesFromTarball()
  }

  async getFilesFromTarball(): Promise<FetchedFile[]> {
    const { data, error } = await this.getTarball()
    if (error) {
      throw new Error(
        `Failed to get tarball for ${this.owner}/${this.repo}@${this.ref}`
      )
    }
    const stream = await this.tarballToStream(data)
    const files = await this.extractFilesFromTarballStream(stream)
    return (await this.injectShas(files)) satisfies FetchedFile[]
  }

  async getTarball() {
    try {
      const response = await this.octokit.request(
        'GET /repos/{owner}/{repo}/tarball/{ref}',
        {
          owner: this.owner,
          repo: this.repo,
          ref: this.ref,
          headers: { Accept: 'application/vnd.github.v3+json' },
        }
      )
      return { data: response.data as unknown as ArrayBuffer, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async tarballToStream(tarball: ArrayBuffer) {
    const buffer = Buffer.from(tarball)
    const stream = Readable.from(buffer).pipe(gunzip())
    return stream
  }

  async extractFilesFromTarballStream(stream: Readable) {
    const files: FetchedFile[] = []
    const extract = tar.extract()
    const extractPromise = new Promise<void>((resolve, reject) => {
      extract.on('entry', (header: any, streamEntry: any, next: any) => {
        const relPath = header.name.split('/').slice(1).join('/')

        if (this.includePaths.has(relPath)) {
          streamEntry.resume()
          return next()
        }

        let content = ''
        streamEntry.setEncoding('utf8')

        streamEntry.on('data', (chunk: any) => (content += chunk))
        streamEntry.on('end', () => {
          files.push({
            path: relPath,
            name: path.basename(relPath),
            content,
            repo: this.repo,
            owner: this.owner,
            sha: '', // sha injected later
          })
          next()
        })
        streamEntry.on('error', reject)
      })

      extract.on('finish', resolve)
      extract.on('error', reject)
    })

    stream.pipe(extract)
    await extractPromise
    return files
  }

  async injectShas(files: FetchedFile[]) {
    const { data, error } = await this.getFilteredTreePaths()
    if (error) {
      throw new Error(
        `Failed to get filtered tree paths for ${this.owner}/${this.repo}@${this.ref}`
      )
    }
    const shaMap = new Map(data.map((item) => [item.path, item.sha]))
    return files.map((file) => ({ ...file, sha: shaMap.get(file.path) || '' }))
  }

  async getFilteredTreePaths() {
    try {
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${this.ref}`,
      })

      const commitSha = refData.object.sha

      const { data: commitData } = await this.octokit.rest.git.getCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: commitSha,
      })

      const treeSha = commitData.tree.sha

      const { data: treeData } = await this.octokit.rest.git.getTree({
        owner: this.owner,
        repo: this.repo,
        tree_sha: treeSha,
        recursive: '1',
      })

      return {
        data: treeData.tree
          .filter((item) => item.type === 'blob' && item.path)
          .map((item) => ({ path: item.path!, sha: item.sha! })),
        error: null,
      }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}
