import { API_REDIS_PREFIX, redis } from '../../createCache'

class CacheService {
  /**
   * Invalidates all company-related cache entries
   * Should be called when company data is updated
   */
  async invalidateCompanyCache() {
    // Get all keys matching the company cache pattern
    const pattern = `${API_REDIS_PREFIX}companies:*`
    const keys = await redis.keys(pattern)

    if (keys && keys.length > 0) {
      await redis.del(keys)
    }
  }
}

export const cacheService = new CacheService()
