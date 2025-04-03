import type { LensData } from '../types/data.js'

/**
 * A Fetcher is responsible for retrieving content from a data source,
 * such as GitHub, Google Drive, a local file system, etc.
 */
export abstract class Fetcher<TInput = unknown> {
  constructor(protected readonly config: TInput) {}
  /**
   * Fetches content and returns an array of LensData.
   * @param input Configuration or input needed to perform the fetch.
   */
  abstract fetch(input?: TInput): Promise<LensData[]>
}
