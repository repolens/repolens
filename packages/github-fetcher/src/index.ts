import * as tar from 'tar'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export interface GithubFile {
  path: string
  content: string
}

export interface GithubFetcherOptions {
  token?: string
}

export class GithubFetcher {
  private token: string
  private githubURL = 'https://api.github.com'

  constructor(options: GithubFetcherOptions) {
    const token = options.token ?? process.env.GITHUB_TOKEN ?? ''
    if (!token) {
      throw new Error('GITHUB_TOKEN is not set')
    }
    this.token = token
  }

  /**
   * Downloads and extracts the tarball from a GitHub repo and returns all files
   */
  async getFilesFromTarball(
    owner: string,
    repo: string,
    ref = 'main'
  ): Promise<GithubFile[]> {
    const url = `${this.githubURL}/repos/${owner}/${repo}/tarball/${ref}`
    console.log(`📦 Downloading ${owner}/${repo}@${ref}...`)

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `${repo}-`))

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!res.ok || !res.body) {
      throw new Error(
        `Failed to download tarball: ${res.statusText} (${res.status})`
      )
    }

    try {
      // Save and extract tarball
      const tarPath = path.join(tmpDir, 'repo.tar.gz')
      const buffer = await res.arrayBuffer()
      await fs.writeFile(tarPath, Buffer.from(buffer))
      await tar.x({
        file: tarPath,
        cwd: tmpDir,
        strip: 1,
      })
      await fs.unlink(tarPath)
    } catch (err) {
      console.error('❌ Failed to extract tarball:', err)
      throw err
    }

    const files: GithubFile[] = []

    async function walk(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            await walk(fullPath)
          } else {
            const content = await fs.readFile(fullPath, 'utf-8')
            const relativePath = path.relative(tmpDir, fullPath)
            files.push({ path: relativePath, content })
          }
        }
      } catch (err) {
        console.error(`❌ Error walking directory ${dir}:`, err)
        throw err
      }
    }

    await walk(tmpDir)
    console.log(`✅ Found ${files.length} files`)
    return files
  }
}
