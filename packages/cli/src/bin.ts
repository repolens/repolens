#!/usr/bin/env node

import { RepoLens } from '@repolens/core'
import { argv, exit } from 'node:process'

const [, , owner, repo, ref = 'main'] = argv

async function main() {
  if (!owner || !repo) {
    console.error('❌ Missing argument: owner and repo')
    console.log('Usage: repo-lens <owner> <repo> [ref]')
    exit(1)
  }

  const lens = RepoLens.create()

  const chunks = await lens.run({ owner, repo, ref })

  for (const chunk of chunks) {
    console.log(`\n📄 File:`)
    console.log(`  Path: ${chunk.metadata.file.path}`)
    console.log(`  Name: ${chunk.metadata.file.name}`)
    console.log(`  SHA: ${chunk.metadata.file.sha}`)

    console.log(`\n📝 Content:`)
    console.log(`  ${chunk.text}`)

    console.log(`\n🔖 Metadata:`)
    console.log(`  Part: ${chunk.metadata.part}`)

    const extra = Object.entries(chunk.metadata).filter(
      ([key]) => !['file', 'part'].includes(key)
    )
    if (extra.length > 0) {
      console.log(`\n🧩 Additional Metadata:`)
      for (const [key, val] of extra) {
        console.log(`  ${key}: ${JSON.stringify(val)}`)
      }
    }

    if (chunk.embedding) {
      console.log(`\n🧠 Embedding Preview:`)
      console.log(`  [${chunk.embedding.slice(0, 5).join(', ')}...]\n`)
    }
  }

  console.log(
    `✅ Parsed and embedded ${chunks.length} chunks from ${owner}/${repo}@${ref}`
  )
}

main().catch((err) => {
  console.error('❌ RepoLens failed:')
  console.error(err)
  exit(1)
})
