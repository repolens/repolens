import type { FetchedFile } from '@repolens/types/fetcher'

export interface FilterOptions {
  includeExtensions?: string[]
  excludePaths?: string[]
  excludeRegex?: RegExp[]
}

export function filterFiles(files: FetchedFile[], options: FilterOptions) {
  const { includeExtensions, excludePaths = [], excludeRegex = [] } = options

  return files
    .filter(({ path }) => {
      const ext = path.split('.').pop()?.toLowerCase()
      if (includeExtensions && !includeExtensions.includes(ext ?? ''))
        return false
    })
    .filter(({ path }) => {
      if (excludePaths.some((p) => path.startsWith(p))) return false
      if (excludeRegex.some((re) => re.test(path.toLowerCase()))) return false

      return true
    })
}
