import { describe, it, expect, jest } from '@jest/globals'
import {
  createReindexFromStoredMarkdown,
  queryWithReindexOnMiss,
  ReportNotIndexedError,
  staleChunksWhere,
} from './chromaRetention'

const noLog = () => {}

describe('staleChunksWhere', () => {
  it('matches chunks indexed before now minus the TTL', () => {
    const now = Date.UTC(2026, 10, 4, 12)
    expect(staleChunksWhere(now, 24)).toEqual({
      indexedAt: { $lt: now - 24 * 60 * 60 * 1000 },
    })
  })
})

describe('queryWithReindexOnMiss', () => {
  it('returns hits without reindexing', async () => {
    const reindex = jest.fn(async () => {})
    const result = await queryWithReindexOnMiss(
      'u',
      async () => ['a'],
      reindex,
      noLog
    )
    expect(result).toEqual(['a'])
    expect(reindex).not.toHaveBeenCalled()
  })

  it('reindexes on a miss and queries again', async () => {
    const query = jest
      .fn<() => Promise<string[]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['a'])
    const reindex = jest.fn(async () => {})

    const result = await queryWithReindexOnMiss('u', query, reindex, noLog)

    expect(result).toEqual(['a'])
    expect(reindex).toHaveBeenCalledWith('u', noLog)
    expect(query).toHaveBeenCalledTimes(2)
  })
})

describe('createReindexFromStoredMarkdown', () => {
  it('indexes the stored markdown', async () => {
    const index = jest.fn(async () => {})
    const reindex = createReindexFromStoredMarkdown({
      loadMarkdown: async () => '# Report',
      index,
    })

    await reindex('u', noLog)

    expect(index).toHaveBeenCalledWith('u', '# Report', noLog)
  })

  it('throws a clear error when there is no stored markdown', async () => {
    const reindex = createReindexFromStoredMarkdown({
      loadMarkdown: async () => '   ',
      index: async () => {},
    })

    await expect(reindex('u', noLog)).rejects.toBeInstanceOf(
      ReportNotIndexedError
    )
  })

  it('shares one rebuild between concurrent calls for the same url', async () => {
    let finish: () => void = () => {}
    const index = jest.fn(
      () => new Promise<void>((resolve) => (finish = resolve))
    )
    const reindex = createReindexFromStoredMarkdown({
      loadMarkdown: async () => '# Report',
      index,
    })

    const a = reindex('u', noLog)
    const b = reindex('u', noLog)
    await new Promise((r) => setImmediate(r))
    finish()
    await Promise.all([a, b])

    expect(index).toHaveBeenCalledTimes(1)
  })

  it('rebuilds again after a failed attempt', async () => {
    const loadMarkdown = jest
      .fn<() => Promise<string | null>>()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce('# Report')
    const index = jest.fn(async () => {})
    const reindex = createReindexFromStoredMarkdown({ loadMarkdown, index })

    await expect(reindex('u', noLog)).rejects.toThrow('db down')
    await reindex('u', noLog)

    expect(index).toHaveBeenCalledTimes(1)
  })
})
