import {
  buildEmbeddingCacheKey,
  buildRetrievalCacheKey,
  normalizeQueryTexts,
  shouldCachePayload,
} from '../src/lib/vectorCacheKeys'

describe('vector cache key helpers', () => {
  test('normalizes query texts whitespace deterministically', () => {
    const normalized = normalizeQueryTexts([
      '  Scope   1  emissions  ',
      'goals\n\n',
    ])
    expect(normalized).toEqual(['Scope 1 emissions', 'goals'])
  })

  test('embedding key is stable for same normalized input', () => {
    const normalized = normalizeQueryTexts(['scope 1', 'scope 2'])
    const keyA = buildEmbeddingCacheKey({
      schemaVersion: 'v1',
      embeddingModel: 'text-embedding-3-small',
      normalizedQueryTexts: normalized,
    })
    const keyB = buildEmbeddingCacheKey({
      schemaVersion: 'v1',
      embeddingModel: 'text-embedding-3-small',
      normalizedQueryTexts: normalized,
    })

    expect(keyA).toBe(keyB)
  })

  test('retrieval key changes when nResults changes', () => {
    const normalized = normalizeQueryTexts(['scope 1'])
    const keyA = buildRetrievalCacheKey({
      schemaVersion: 'v1',
      reportVersion: '100',
      url: 'https://example.com/report.pdf',
      embeddingModel: 'text-embedding-3-small',
      nResults: 10,
      normalizedQueryTexts: normalized,
    })
    const keyB = buildRetrievalCacheKey({
      schemaVersion: 'v1',
      reportVersion: '100',
      url: 'https://example.com/report.pdf',
      embeddingModel: 'text-embedding-3-small',
      nResults: 15,
      normalizedQueryTexts: normalized,
    })

    expect(keyA).not.toBe(keyB)
  })

  test('retrieval key changes when report version changes', () => {
    const normalized = normalizeQueryTexts(['scope 1'])
    const keyA = buildRetrievalCacheKey({
      schemaVersion: 'v1',
      reportVersion: '100',
      url: 'https://example.com/report.pdf',
      embeddingModel: 'text-embedding-3-small',
      nResults: 10,
      normalizedQueryTexts: normalized,
    })
    const keyB = buildRetrievalCacheKey({
      schemaVersion: 'v1',
      reportVersion: '101',
      url: 'https://example.com/report.pdf',
      embeddingModel: 'text-embedding-3-small',
      nResults: 10,
      normalizedQueryTexts: normalized,
    })

    expect(keyA).not.toBe(keyB)
  })

  test('payload guard only caches values under configured byte size', () => {
    expect(shouldCachePayload('small', 8)).toBe(true)
    expect(shouldCachePayload('this is too large', 4)).toBe(false)
  })

  test('payload guard boundary includes exact byte-size match', () => {
    expect(shouldCachePayload('1234', 4)).toBe(true)
    expect(shouldCachePayload('12345', 4)).toBe(false)
  })
})
