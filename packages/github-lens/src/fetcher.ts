import { Octokit } from 'octokit'
import tar from 'tar-stream'
import gunzip from 'gunzip-maybe'
import { Readable } from 'node:stream'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { Fetcher, type LensData } from '@repolens/core'
import { getGithubConfig } from '@repolens/config'

export interface GitHubFetcherInput {
  owner: string
  repo: string
  ref?: string
  token?: string
  includePaths?: Set<string>
  octokit?: Octokit
}

export class GitHubFetcher extends Fetcher<GitHubFetcherInput> {
  async fetch(): Promise<LensData[]> {
    const {
      owner,
      repo,
      ref = 'main',
      token,
      includePaths = new Set(),
      octokit,
    } = this.config

    const client =
      octokit ?? new Octokit({ auth: token ?? getGithubConfig().GITHUB_TOKEN })

    const tarball = await this.getTarball(client, owner, repo, ref)
    const stream = await this.tarballToStream(tarball)
    const files = await this.extractFilesFromTarballStream(
      stream,
      owner,
      repo,
      includePaths
    )
    const withShas = await this.injectShas(client, files, owner, repo, ref)

    return withShas
  }

  private async getTarball(
    octokit: Octokit,
    owner: string,
    repo: string,
    ref: string
  ) {
    try {
      const res = await octokit.request(
        'GET /repos/{owner}/{repo}/tarball/{ref}',
        {
          owner,
          repo,
          ref,
          headers: { Accept: 'application/vnd.github.v3+json' },
        }
      )
      return res.data as ArrayBuffer
    } catch (error) {
      throw new Error(`Failed to fetch tarball for ${owner}/${repo}@${ref}`)
    }
  }

  private async tarballToStream(tarball: ArrayBuffer) {
    const buffer = Buffer.from(tarball)
    return Readable.from(buffer).pipe(gunzip())
  }

  private async extractFilesFromTarballStream(
    stream: Readable,
    owner: string,
    repo: string,
    includePaths: Set<string>
  ): Promise<LensData[]> {
    const files: LensData[] = []
    const extract = tar.extract()

    const promise = new Promise<void>((resolve, reject) => {
      extract.on('entry', (header, entry, next) => {
        const relPath = header.name.split('/').slice(1).join('/')
        if (includePaths.size > 0 && !includePaths.has(relPath)) {
          entry.resume()
          return next()
        }

        let content = ''
        entry.setEncoding('utf8')
        entry.on('data', (chunk) => (content += chunk))
        entry.on('end', () => {
          files.push({
            content,
            metadata: {
              path: relPath,
              name: path.basename(relPath),
              repo,
              owner,
              sha: '',
            },
          })
          next()
        })
        entry.on('error', reject)
      })

      extract.on('finish', resolve)
      extract.on('error', reject)
    })

    stream.pipe(extract)
    await promise
    return files
  }

  private async injectShas(
    octokit: Octokit,
    files: LensData[],
    owner: string,
    repo: string,
    ref: string
  ) {
    try {
      const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${ref}`,
      })

      const commitSha = refData.object.sha
      const { data: commitData } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: commitSha,
      })

      const treeSha = commitData.tree.sha
      const { data: treeData } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: '1',
      })

      const shaMap = new Map(
        treeData.tree
          .filter((i) => i.type === 'blob' && i.path)
          .map((i) => [i.path!, i.sha!])
      )

      return files.map((file) => ({
        ...file,
        metadata: {
          ...file.metadata,
          sha: shaMap.get(file.metadata?.path as string) ?? '',
        },
      }))
    } catch (error) {
      throw new Error(`Failed to fetch file SHAs for ${owner}/${repo}@${ref}`)
    }
  }
}
