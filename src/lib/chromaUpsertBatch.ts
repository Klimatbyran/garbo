import { isChromaPayloadTooLarge } from './chromaRetry'

type Log = (msg: string) => void

/** Default chunk count per Chroma upsert; oversized batches split on 413. */
export const DEFAULT_CHROMA_UPSERT_BATCH_SIZE = 50

/**
 * Run `upsertRange(from, to)` for `[startIndex, endIndex)`. On a 413 Payload
 * Too Large response, split the range in half and retry each half until a
 * single item still fails (then rethrow).
 */
export async function upsertRangeWithAdaptiveBatch(options: {
  startIndex: number
  endIndex: number
  upsertRange: (from: number, to: number) => Promise<void>
  log?: Log
  label?: string
}): Promise<void> {
  const {
    startIndex,
    endIndex,
    upsertRange,
    log = console.log,
    label = 'upsert',
  } = options
  if (endIndex <= startIndex) return

  try {
    await upsertRange(startIndex, endIndex)
  } catch (err) {
    const size = endIndex - startIndex
    if (size > 1 && isChromaPayloadTooLarge(err)) {
      const mid = startIndex + Math.ceil(size / 2)
      log(
        `ChromaDB ${label} payload too large for items ${startIndex}-${endIndex - 1} (${size}); splitting at ${mid}`
      )
      await upsertRangeWithAdaptiveBatch({
        startIndex,
        endIndex: mid,
        upsertRange,
        log,
        label,
      })
      await upsertRangeWithAdaptiveBatch({
        startIndex: mid,
        endIndex,
        upsertRange,
        log,
        label,
      })
      return
    }
    throw err
  }
}

/** Walk `total` items in fixed-size windows, each window adaptive on 413. */
export async function upsertAllWithAdaptiveBatches(options: {
  total: number
  batchSize?: number
  upsertRange: (from: number, to: number) => Promise<void>
  betweenBatches?: () => Promise<void>
  log?: Log
  label?: string
}): Promise<void> {
  const {
    total,
    batchSize = DEFAULT_CHROMA_UPSERT_BATCH_SIZE,
    upsertRange,
    betweenBatches,
    log,
    label,
  } = options

  for (let i = 0; i < total; i += batchSize) {
    const end = Math.min(i + batchSize, total)
    await upsertRangeWithAdaptiveBatch({
      startIndex: i,
      endIndex: end,
      upsertRange,
      log,
      label,
    })
    if (betweenBatches && end < total) {
      await betweenBatches()
    }
  }
}
