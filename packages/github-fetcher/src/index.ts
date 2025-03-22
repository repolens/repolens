import * as tar from 'tar'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export interface GitHubFile {
  path: string
  content: string
}

/**
 * Downloads and extracts the tarball from a GitHub repo and returns all files
 */
export async function getFilesFromTarball(
  owner: string,
  repo: string,
  ref = 'main'
): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/tarball/${ref}`
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `${repo}-`))

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!res.ok || !res.body) {
    throw new Error(`Failed to download tarball: ${res.statusText}`)
  }

  await tar.x(
    {
      cwd: tmpDir,
      file: undefined,
      strip: 1,
      sync: false,
      gzip: true,
      onentry: () => {},
      // @ts-ignore
      readable: true,
    },
    res.body
  )

  const files: GitHubFile[] = []

  async function walk(dir: string) {
    console.log('walking', dir)
    const entries = await fs.readdir(dir, { withFileTypes: true })

    console.log('entries', entries)
    for (const entry of entries) {
      console.log('entry', entry)
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else {
        const content = await fs.readFile(fullPath, 'utf-8')
        const relativePath = path.relative(tmpDir, fullPath)
        files.push({ path: relativePath, content })
      }
    }
  }

  await walk(tmpDir)
  return files
}
