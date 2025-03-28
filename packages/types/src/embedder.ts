export interface Embedder {
  embed(texts: string[]): Promise<Map<number, number[]>>
  generateEmbeddableChunks(
    text: string,
    tokenLimit?: number,
    overlap?: number
  ): string[]
}
