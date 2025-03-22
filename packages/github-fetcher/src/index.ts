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
  console.log(`📦 Downloading ${owner}/${repo}@${ref}...`)

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `${repo}-`))

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
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

  const files: GitHubFile[] = []

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
