#!/usr/bin/env node

import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from package directory, accounting for both source and dist contexts
const envPath = path.resolve(
  __dirname,
  process.env.NODE_ENV === 'production' ? '../../.env' : '../.env'
)
dotenv.config({ path: envPath })

// Debug: Check if GITHUB_TOKEN is loaded (showing first 4 chars only for security)
const token = process.env.GITHUB_TOKEN
console.log(
  'GITHUB_TOKEN loaded:',
  token ? `${token.slice(0, 4)}...` : 'not found'
)

import { parseFile } from '@repo-vector/parser-core'
import { getFilesFromTarball } from '@repo-vector/github-fetcher'

const [, , owner, repo, ref = 'main'] = process.argv

if (!owner || !repo) {
  console.error('Usage: parser <owner> <repo> [ref]')
  process.exit(1)
}

async function run() {
  console.log(`📦 Downloading tarball for ${owner}/${repo}@${ref}...`)

  if (!owner || !repo) {
    console.error('Usage: parser <owner> <repo> [ref]')
    process.exit(1)
  }

  const files = await getFilesFromTarball(owner, repo, ref)
  console.log(`🧾 Found ${files.length} files.`)

  let totalChunks = 0

  for (const file of files) {
    const chunks = parseFile(file)
    if (chunks.length > 0) {
      console.log(`\n📄 ${file.path}`)
      for (const chunk of chunks) {
        console.log(`  - [${chunk.language}] ${chunk.type}: ${chunk.name}`)
      }
      totalChunks += chunks.length
    }
  }

  console.log(`\n✅ Parsed ${totalChunks} chunks from ${files.length} files.`)
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
