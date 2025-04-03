import { isSkippableFile } from './filters.js'

// Test paths to check
const testPaths = [
  // Binary files that should be skipped
  'apps/docs/app/favicon.ico',
  'apps/web/app/fonts/GeistMonoVF.woff',
  'apps/web/app/fonts/GeistVF.woff',

  // Lock files that should be skipped
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',

  // Source files that should NOT be skipped
  'src/index.ts',
  'components/Button.tsx',
  'utils/helpers.js',
  'README.md',

  // Files in directories that should be skipped
  'node_modules/react/index.js',
  'dist/bundle.js',
  'build/main.js',

  // Other common files
  '.env',
  'LICENSE',
  'CHANGELOG.md',
]

// Run the tests
console.log('Testing filter functionality:')
console.log('----------------------------')

for (const path of testPaths) {
  const shouldSkip = isSkippableFile(path)
  console.log(
    `${shouldSkip ? '✓' : '✗'} ${path} ${shouldSkip ? 'SKIPPED' : 'KEPT'}`
  )
}

console.log('----------------------------')
