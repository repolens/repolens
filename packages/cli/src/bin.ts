#!/usr/bin/env node

import { GithubLens } from '@repolens/core'
import { argv, exit } from 'node:process'

const [, , owner, repo, ref = 'main'] = argv

async function main() {
  if (!owner || !repo) {
    console.error('❌ Missing argument: owner and repo')
    console.log('Usage: repo-lens <owner> <repo> [ref]')
    exit(1)
  }

  const lens = new GithubLens({ owner, repo, ref })

  const chunks = await lens.run()

  for (const chunk of chunks) {
    console.log(`\n📄 File:`)
    console.log(`  Path: ${chunk.metadata.path}`)
    console.log(`  Name: ${chunk.metadata.name}`)
    console.log(`  SHA: ${chunk.metadata.sha}`)

    console.log(`\n📝 Content:`)
    console.log(`  ${chunk.content}`)

    console.log(`\n🔖 Metadata:`)
    console.log(`  Part: ${chunk.metadata.part}`)

    const extra = Object.entries(chunk.metadata).filter(
      ([key]) => !['path', 'name', 'sha', 'part'].includes(key)
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
