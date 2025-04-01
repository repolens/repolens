import { LensData } from './data.js'

export interface Fetcher {
  fetch(...args: any[]): Promise<LensData[]>
}
