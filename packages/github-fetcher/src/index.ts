// packages/github-fetcher/src/GitHubFetcher.ts

import { Octokit } from 'octokit'
import path from 'path'
import tar from 'tar-stream'
import gunzip from 'gunzip-maybe'
import { Readable } from 'stream'
import { Buffer } from 'buffer'

export interface GitHubFile {
  path: string
  name: string
  content: string
  sha: string
}

export interface GitHubFetcherOptions {
  token?: string
}

export class GitHubFetcher {
  private octokit: Octokit

  constructor(options: GitHubFetcherOptions = {}) {
    this.octokit = new Octokit({
      auth: options.token || process.env.GITHUB_TOKEN,
    })
  }

  async getFilteredTreePaths(
    owner: string,
    repo: string,
    ref = 'HEAD'
  ): Promise<{ path: string; sha: string }[]> {
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

    return treeData.tree
      .filter((item) => item.type === 'blob' && item.path)
      .map((item) => ({ path: item.path!, sha: item.sha! }))
  }

  async getFilesFromTarball(
    owner: string,
    repo: string,
    ref: string = 'HEAD',
    includePaths: Set<string>
  ): Promise<GitHubFile[]> {
    const response = await this.octokit.request(
      'GET /repos/{owner}/{repo}/tarball/{ref}',
      {
        owner,
        repo,
        ref,
        headers: { Accept: 'application/vnd.github.v3+json' },
      }
    )

    const buffer = Buffer.from(response.data as ArrayBuffer)
    const extract = tar.extract()
    const stream = Readable.from(buffer).pipe(gunzip())

    const files: GitHubFile[] = []

    const finished = new Promise<void>((resolve, reject) => {
      extract.on('entry', (header: any, streamEntry: any, next: any) => {
        const relPath = header.name.split('/').slice(1).join('/')

        if (!includePaths.has(relPath)) {
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

    await finished
    return files
  }
}
