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

import { RepoLens } from '@repolens/core'

const [, , owner, repo, ref = 'main'] = process.argv

async function run() {
  if (!owner || !repo) {
    console.error('Usage: parser <owner> <repo> [ref]')
    process.exit(1)
  }

  const client = new RepoLens({
    owner,
    repo,
    ref,
    // You can also add includeExtensions, filters, etc.
  })

  const chunks = await client.run()

  for (const chunk of chunks) {
    console.log(`\n📄 ${chunk.filePath}`)
    console.log(`  - [${chunk.language}] ${chunk.type}: ${chunk.name}`)
    console.log(
      `  - 🔢 embedding: [${chunk.embedding?.slice(0, 5).join(', ')}...]\n`
    )
  }

  console.log(
    `✅ Parsed and embedded ${chunks.length} chunks from ${owner}/${repo}@${ref}`
  )
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
