import { LensData } from './data.js'

export interface Fetcher {
  fetch(): Promise<LensData[]>
}
