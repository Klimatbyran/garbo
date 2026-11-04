// Looks up the Chroma collection lazily and again whenever it goes missing,
// so workers survive Chroma being down at startup and a wiped/deleted
// collection without needing a restart.

/** True for errors meaning the cached collection id no longer exists in Chroma. */
export function isMissingCollectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  if (
    err.name === 'ChromaNotFoundError' ||
    err.name === 'InvalidCollectionError'
  ) {
    return true
  }
  return /collection .*(does not exist|not found)/i.test(err.message)
}

export function createCollectionCache<C>(open: () => Promise<C>) {
  let cached: Promise<C> | null = null

  const get = (): Promise<C> => {
    if (!cached) {
      // Don't cache a failed lookup (e.g. Chroma down): the next call retries.
      cached = open().catch((err) => {
        cached = null
        throw err
      })
    }
    return cached
  }

  /** Runs fn with the collection; if the collection is gone, looks it up again and retries once. */
  const withCollection = async <T>(fn: (c: C) => Promise<T>): Promise<T> => {
    const collection = await get()
    try {
      return await fn(collection)
    } catch (err) {
      if (!isMissingCollectionError(err)) throw err
      if (cached && (await cached.catch(() => null)) === collection) {
        cached = null
      }
      return fn(await get())
    }
  }

  return { get, withCollection }
}
