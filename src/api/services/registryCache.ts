export const REGISTRY_DATA_KEY = 'registry:data'
export const REGISTRY_ETAG_KEY = 'registry:etag'

type Cache = { delete: (key: string) => Promise<void> }
type Logger = { warn: (msg: string, ...args: unknown[]) => void }

/**
 * Invalidates both registry cache keys. Uses Promise.allSettled so a Redis
 * failure does not propagate to the caller and leaves the response unaffected.
 */
export async function invalidateRegistryCache(
  cache: Cache,
  log?: Logger
): Promise<void> {
  const results = await Promise.allSettled([
    cache.delete(REGISTRY_DATA_KEY),
    cache.delete(REGISTRY_ETAG_KEY),
  ])

  for (const result of results) {
    if (result.status === 'rejected') {
      log?.warn('Failed to invalidate registry cache: %o', result.reason)
    }
  }
}
