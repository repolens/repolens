# RepoLens

RepoLens is a powerful tool for analyzing Git repositories through embeddings. It streamlines the process of fetching, parsing, and embedding repository content, making it easier to perform semantic analysis on codebases.

## Features

- 🔍 **Repository Analysis**: Fetch and analyze content from Git repositories
- 🧩 **Smart Chunking**: Intelligently split code into meaningful, context-aware chunks
- 🔮 **Embeddings Generation**: Create embeddings from code chunks using state-of-the-art models
- 🛠️ **Customizable**: Extend or replace any component with your own implementation
- 🚀 **GitHub Integration**: Built-in support for GitHub repositories

## Installation

```bash
pnpm add @repolens/core
```

## Quick Start

```typescript
import { RepoLens } from '@repolens/core'

const repolens = RepoLens.create()
const chunks = await repolens.run({
  owner: 'organization',
  repo: 'repository',
})
```

## Documentation

For detailed documentation and advanced usage, visit our [documentation](https://github.com/crathor/repolens/wiki).

## License

MIT © [Cody Rathor](cody@codyval.dev)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18 or higher)
- pnpm (version 9.0.0 or higher)

## Development Setup

1. Start the development server:

```bash
pnpm dev
```

2. Build the project:

```bash
pnpm build
```

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build all packages and applications
- `pnpm lint` - Run linting across the project
- `pnpm format` - Format code using Prettier
- `pnpm check-types` - Run TypeScript type checking
- `pnpm release` - Create a new changeset
- `pnpm version` - Update package versions based on changesets
- `pnpm publish` - Publish packages to npm

## Project Structure

```
repolens/
├── apps/           # Frontend and backend applications
├── packages/       # Shared packages and libraries
├── config/         # Shared configuration files
└── .changeset/     # Changeset configuration for versioning
```

## Contributing

1. Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:

```bash
git commit -m "feat: add your feature"
```

3. Push to your branch:

```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request on GitHub

## Support

[Add support information or contact details here]

## Configuration

You can customize RepoLens by providing your own configuration:

```typescript
import { RepoLens } from '@repolens/core'
import { CustomParser } from './my-parser'
import { CustomChunker } from './my-chunker'
import { CustomEmbedder } from './my-embedder'
import { CustomFetcher } from './my-fetcher'

const repolens = RepoLens.create({
  parser: new CustomParser(),
  chunker: new CustomChunker(),
  embedder: new CustomEmbedder(),
  fetcher: new CustomFetcher(),
})
```

### Default Components

RepoLens comes with several default components:

- Parser: `RepoLensParser` - Parses repository content
- Chunker: `TokenChunker` - Chunks content with 8000 token size and 200 token overlap
- Embedder: `OpenAIEmbedder` - Uses OpenAI's embedding API
- Fetcher: `GitHubFetcher` - Fetches content from GitHub repositories

## API Reference

### RepoLens.create(config?)

Creates a new RepoLens instance with optional configuration.

### repolens.run(input)

Runs analysis on a repository. For GitHub repositories, the input should include:

- `owner`: Repository owner/organization
- `repo`: Repository name
- `ref?`: Branch or commit reference (optional)
- `includeRepoInfo?`: Whether to include repository metadata (optional)

Returns a promise that resolves to an array of `EmbeddedChunk` objects.

## File Filtering

When embedding a repository, RepoLens automatically filters out binary and non-parsable files like:

- Binary files (images, fonts, executables, etc.)
- Lock files (package-lock.json, yarn.lock, pnpm-lock.yaml, etc.)
- Build artifacts and directories (dist/, build/, .next/, etc.)
- Other common non-code files (.env, .DS_Store, etc.)

This filtering helps prevent token limit errors and improves embedding performance. You can control this behavior with the `excludeNonParsable` option:

```typescript
// Use the default filtering (recommended)
const lens = new GitHubLens({
  fetcherOptions: {
    owner: 'username',
    repo: 'repo-name',
    // excludeNonParsable: true, // This is the default
  },
})

// Disable filtering (not recommended)
const lens = new GitHubLens({
  fetcherOptions: {
    owner: 'username',
    repo: 'repo-name',
    excludeNonParsable: false, // Process all files, may cause token limit errors
  },
})
```
