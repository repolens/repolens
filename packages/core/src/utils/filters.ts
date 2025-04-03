// utils/filters.ts
const SKIP_EXTENSIONS = [
  // binaries + fonts + archives
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.icns',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.zip',
  '.gz',
  '.tar',
  '.rar',
  '.7z',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.a',
  '.o',
  '.pyc',
  '.pyd',
  '.class',
  '.lock',
  '.pdf',
  '.wasm',
  '.log',

  // Images and media
  '.bmp',
  '.tiff',
  '.webm',
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.heic',
  '.avif',
  '.psd',
  '.ai',

  // Binary document formats
  '.docx',
  '.xlsx',
  '.pptx',
  '.doc',
  '.xls',
  '.ppt',

  // Database files
  '.db',
  '.sqlite',
  '.sqlite3',
  '.mdb',
  '.accdb',
  '.frm',
  '.ibd',

  // build artifacts / bundles
  '.min.js',
  '.map',
  '.bundle.js',
  '.out',
  '.node',
]

const SKIP_FILENAMES = [
  // JS ecosystem
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  '.npmrc',
  '.yarnrc',
  '.pnpmrc',

  // Rust
  'Cargo.lock',

  // Python
  'poetry.lock',
  'Pipfile.lock',

  // Ruby
  'Gemfile.lock',

  // C/C++
  'Makefile',
  'CMakeCache.txt',
  'compile_commands.json',

  // Go
  'go.sum',

  // Java/Kotlin
  'gradle.lockfile',
  'gradle-wrapper.jar',

  // .NET
  'packages.lock.json',

  // Generic
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'CHANGELOG.md',
  '.DS_Store',
  'Thumbs.db',
  '.gitignore',
  '.dockerignore',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
]

const SKIP_DIRS = [
  '__pycache__',
  'node_modules',
  'target',
  'dist',
  'build',
  'out',
  '.next',
  '.git',
  '.github',
  '.husky',
  '.vscode',
  '.idea',
  'coverage',
  'vendor',
  'bin',
  'obj',
  'public/assets',
  'public/static',
  'public/images',
  'public/fonts',
  'public/uploads',
  'assets',
  'static',
  'fonts',
  'images',
]

/**
 * Determines if a file should be skipped during processing based on its path.
 * Checks against common binary files, lock files, build artifacts, and more.
 */
export function isSkippableFile(path: string): boolean {
  const lowerPath = path.toLowerCase()

  // Check if the file has an extension to skip
  if (SKIP_EXTENSIONS.some((ext) => lowerPath.endsWith(ext))) {
    return true
  }

  // Get just the filename for exact matching
  const filename = lowerPath.split('/').pop() || ''

  // Check if the filename is in the skip list
  if (SKIP_FILENAMES.includes(filename)) {
    return true
  }

  // Check if the file is in a directory to skip
  if (SKIP_DIRS.some((dir) => lowerPath.includes(`/${dir}/`))) {
    return true
  }

  return false
}
