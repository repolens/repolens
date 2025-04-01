import type { RepoLensFile } from '@repolens/types'

export interface FilterOptions {
  includeExtensions?: string[]
  excludePaths?: string[]
  excludeRegex?: RegExp[]
}

export function filterFiles(files: RepoLensFile[], options: FilterOptions) {
  const { includeExtensions, excludePaths = [], excludeRegex = [] } = options

  return files
    .filter(({ metadata }) => {
      const ext = metadata?.path?.split('.').pop()?.toLowerCase()
      if (includeExtensions && !includeExtensions.includes(ext ?? ''))
        return false
    })
    .filter(({ metadata }) => {
      const path = metadata?.path
      if (excludePaths.some((p) => path?.startsWith(p))) return false
      if (excludeRegex.some((re) => re.test(path?.toLowerCase() ?? '')))
        return false

      return true
    })
}
