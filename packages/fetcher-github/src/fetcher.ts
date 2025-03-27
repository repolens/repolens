import type { Octokit } from 'octokit'
import tar from 'tar-stream'
import gunzip from 'gunzip-maybe'
import { Readable } from 'node:stream'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import type { Fetcher, FetchedFile } from '@repolens/fetcher-types'

interface FetcherOptions {
  owner: string
  repo: string
  ref?: string
  includePaths?: Set<string>
}

export class GitHubFetcher implements Fetcher<FetcherOptions> {
  private readonly octokit: Octokit

  constructor(octokit: Octokit) {
    this.octokit = octokit
  }

  async fetch({
    owner,
    repo,
    ref = 'HEAD',
    includePaths = new Set(),
  }: FetcherOptions): Promise<FetchedFile[]> {
    return await this.getFilesFromTarball({
      owner,
      repo,
      ref,
      includePaths,
    })
  }

  async getFilesFromTarball({
    owner,
    repo,
    ref,
    includePaths,
  }: Required<FetcherOptions>): Promise<FetchedFile[]> {
    const { data, error } = await this.getTarball({ owner, repo, ref })
    if (error) {
      throw new Error(`Failed to get tarball for ${owner}/${repo}@${ref}`)
    }
    const stream = await this.tarballToStream(data)
    const files = await this.extractFilesFromTarballStream(stream, includePaths)
    return (await this.injectShas(files, {
      owner,
      repo,
      ref,
    })) satisfies FetchedFile[]
  }

  async getTarball({
    owner,
    repo,
    ref,
  }: Required<Omit<FetcherOptions, 'includePaths'>>) {
    try {
      const response = await this.octokit.request(
        'GET /repos/{owner}/{repo}/tarball/{ref}',
        {
          owner,
          repo,
          ref,
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

  async extractFilesFromTarballStream(
    stream: Readable,
    includePaths: Required<FetcherOptions>['includePaths']
  ) {
    const files: FetchedFile[] = []
    const extract = tar.extract()
    await new Promise<void>((resolve, reject) => {
      extract.on('entry', (header: any, streamEntry: any, next: any) => {
        const relPath = header.name.split('/').slice(1).join('/')

        if (includePaths.has(relPath)) {
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
    return files
  }

  async injectShas(
    files: FetchedFile[],
    { owner, repo, ref }: Omit<FetcherOptions, 'includePaths'>
  ) {
    const { data, error } = await this.getFilteredTreePaths({
      owner,
      repo,
      ref,
    })
    if (error) {
      throw new Error(
        `Failed to get filtered tree paths for ${owner}/${repo}@${ref}`
      )
    }
    const shaMap = new Map(data.map((item) => [item.path, item.sha]))
    return files.map((file) => ({ ...file, sha: shaMap.get(file.path) || '' }))
  }

  async getFilteredTreePaths({
    owner,
    repo,
    ref,
  }: Omit<FetcherOptions, 'includePaths'>) {
    try {
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${ref}`,
      })

      const commitSha = refData.object.sha

      const { data: commitData } = await this.octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: commitSha,
      })

      const treeSha = commitData.tree.sha

      const { data: treeData } = await this.octokit.rest.git.getTree({
        owner,
        repo,
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
