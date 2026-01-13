import { createClient, RedisClientType } from 'redis'
import redisConfig from './config/redis'

// Note: This prefix is a good seperator from the bullMQ jobs
export const API_REDIS_PREFIX = 'redis_api/'

const redisUrl = `redis://default:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`

let redis: RedisClientType | null = null

// Lazy initialization to avoid connection errors when Redis isn't running
async function getRedis() {
  if (!redis) {
    redis = createClient({
      url: redisUrl,
    })
    await redis.connect()
  }
  return redis
}

export function createServerCache({ maxAge }: { maxAge: number }) {
  return {
    async set(key: string, value: string) {
      const client = await getRedis()
      const namespacedKey = `${API_REDIS_PREFIX}${key}`
      await client.set(namespacedKey, value, { PX: maxAge })
    },
    async get(key: string) {
      const client = await getRedis()
      const namespacedKey = `${API_REDIS_PREFIX}${key}`
      const cached = await client.get(namespacedKey)
      return cached ? JSON.parse(cached) : null
    },
    async has(key: string) {
      const client = await getRedis()
      const namespacedKey = `${API_REDIS_PREFIX}${key}`
      return (await client.exists(namespacedKey)) === 1
    },
    async delete(key: string) {
      const client = await getRedis()
      const namespacedKey = `${API_REDIS_PREFIX}${key}`
      await client.del(namespacedKey)
    },
    async clear() {
      const client = await getRedis()
      const keys = await client.keys(`${API_REDIS_PREFIX}*`)
      if (keys.length > 0) await client.del(keys)
    },
  }
}
