import { createClient } from 'redis'
import redisConfig from './config/redis'

// Note: This prefix is a good seperator from the bullMQ jobs
export const API_REDIS_PREFIX = 'redis_api/'

const redis = createClient({ ...redisConfig })
redis.connect()

export function createServerCache({ maxAge }: { maxAge: number }) {
  return {
    async set(key: string, value: any) {
      const namespacedKey = `${API_REDIS_PREFIX}${key}`
      await redis.set(namespacedKey, JSON.stringify(value), { PX: maxAge })
    },
    async get(key: string) {
      const namespacedKey = `${API_REDIS_PREFIX}${key}`
      const cached = await redis.get(namespacedKey)
      return cached ? JSON.parse(cached) : null
    },
    async has(key: string) {
      const namespacedKey = `${API_REDIS_PREFIX}${key}`
      return (await redis.exists(namespacedKey)) === 1
    },
    async delete(key: string) {
      const namespacedKey = `${API_REDIS_PREFIX}${key}`
      await redis.del(namespacedKey)
    },
    async clear() {
      const keys = await redis.keys(`${API_REDIS_PREFIX}*`)
      if (keys.length > 0) await redis.del(keys)
    },
  }
}
