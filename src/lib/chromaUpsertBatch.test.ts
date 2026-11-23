import { describe, it, expect, jest } from '@jest/globals'
import {
  DEFAULT_CHROMA_UPSERT_BATCH_SIZE,
  upsertAllWithAdaptiveBatches,
  upsertRangeWithAdaptiveBatch,
} from './chromaUpsertBatch'

const noLog = () => {}

function payloadTooLarge() {
  const err = new Error('413: Payload Too Large')
  err.name = 'ChromaServerError'
  return err
}

describe('upsertRangeWithAdaptiveBatch', () => {
  it('upserts the full range when it fits', async () => {
    const upsertRange = jest.fn(async () => {})
    await upsertRangeWithAdaptiveBatch({
      startIndex: 0,
      endIndex: 50,
      upsertRange,
      log: noLog,
    })
    expect(upsertRange).toHaveBeenCalledTimes(1)
    expect(upsertRange).toHaveBeenCalledWith(0, 50)
  })

  it('splits on 413 until ranges succeed', async () => {
    const calls: Array<[number, number]> = []
    const upsertRange = jest.fn(async (from: number, to: number) => {
      calls.push([from, to])
      // Fail only the initial 50-wide window (the failing prod batch shape).
      if (to - from > 25) throw payloadTooLarge()
    })

    await upsertRangeWithAdaptiveBatch({
      startIndex: 150,
      endIndex: 200,
      upsertRange,
      log: noLog,
      label: 'upsert (report)',
    })

    expect(calls[0]).toEqual([150, 200])
    expect(calls).toContainEqual([150, 175])
    expect(calls).toContainEqual([175, 200])
    expect(upsertRange).toHaveBeenCalledTimes(3)
  })

  it('keeps splitting nested oversized halves', async () => {
    const upsertRange = jest.fn(async (from: number, to: number) => {
      if (to - from > 1) throw payloadTooLarge()
    })

    await upsertRangeWithAdaptiveBatch({
      startIndex: 0,
      endIndex: 4,
      upsertRange,
      log: noLog,
    })

    // 0-4 → 0-2,2-4 → 0-1,1-2,2-3,3-4 (plus the failed parents)
    expect(upsertRange).toHaveBeenCalledWith(0, 1)
    expect(upsertRange).toHaveBeenCalledWith(1, 2)
    expect(upsertRange).toHaveBeenCalledWith(2, 3)
    expect(upsertRange).toHaveBeenCalledWith(3, 4)
  })

  it('rethrows when a single item is still too large', async () => {
    const upsertRange = jest.fn(async () => {
      throw payloadTooLarge()
    })

    await expect(
      upsertRangeWithAdaptiveBatch({
        startIndex: 3,
        endIndex: 4,
        upsertRange,
        log: noLog,
      })
    ).rejects.toMatchObject({
      name: 'ChromaServerError',
      message: '413: Payload Too Large',
    })
    expect(upsertRange).toHaveBeenCalledTimes(1)
  })

  it('rethrows non-413 errors without splitting', async () => {
    const upsertRange = jest.fn(async () => {
      throw new Error('disk full')
    })

    await expect(
      upsertRangeWithAdaptiveBatch({
        startIndex: 0,
        endIndex: 50,
        upsertRange,
        log: noLog,
      })
    ).rejects.toThrow('disk full')
    expect(upsertRange).toHaveBeenCalledTimes(1)
  })
})

describe('upsertAllWithAdaptiveBatches', () => {
  it('uses the default window size of 50', () => {
    expect(DEFAULT_CHROMA_UPSERT_BATCH_SIZE).toBe(50)
  })

  it('walks fixed windows and splits only the oversized ones', async () => {
    const ranges: Array<[number, number]> = []
    await upsertAllWithAdaptiveBatches({
      total: 120,
      batchSize: 50,
      log: noLog,
      upsertRange: async (from, to) => {
        ranges.push([from, to])
        if (from === 50 && to === 100) throw payloadTooLarge()
      },
    })

    expect(ranges[0]).toEqual([0, 50])
    expect(ranges).toContainEqual([50, 100])
    expect(ranges).toContainEqual([50, 75])
    expect(ranges).toContainEqual([75, 100])
    expect(ranges).toContainEqual([100, 120])
  })
})
