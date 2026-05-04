import { createHash } from 'node:crypto'

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function normalizeQueryTexts(queryTexts: string[]): string[] {
  return queryTexts.map((q) => q.trim().replace(/\s+/g, ' '))
}

export function buildEmbeddingCacheKey(args: {
  schemaVersion: string
  embeddingModel: string
  normalizedQueryTexts: string[]
}): string {
  const { schemaVersion, embeddingModel, normalizedQueryTexts } = args
  const queryHash = sha256(normalizedQueryTexts.join('\n'))
  return `emb:${schemaVersion}:${embeddingModel}:${queryHash}`
}

export function buildRetrievalCacheKey(args: {
  schemaVersion: string
  reportVersion: string
  url: string
  embeddingModel: string
  nResults: number
  normalizedQueryTexts: string[]
}): string {
  const {
    schemaVersion,
    reportVersion,
    url,
    embeddingModel,
    nResults,
    normalizedQueryTexts,
  } = args

  const queryHash = sha256(normalizedQueryTexts.join('\n'))
  return `ctx:${schemaVersion}:${reportVersion}:${sha256(url)}:${embeddingModel}:${nResults}:${queryHash}`
}

export function shouldCachePayload(
  payload: string,
  maxPayloadBytes: number
): boolean {
  return Buffer.byteLength(payload, 'utf8') <= maxPayloadBytes
}
