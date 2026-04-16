import { createClient, RedisClientType } from 'redis'
import redisConfig from './config/redis'

// Note: This prefix is a good seperator from the bullMQ jobs
export const API_REDIS_PREFIX = 'redis_api/'

const redisUrl = `redis://default:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`

let redis: RedisClientType | null = null

// Lazy initialization - connection errors are caught per-call so the API falls back to the DB
async function getRedis() {
  if (!redis || !redis.isOpen) {
    redis = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: false,
      },
    })
    redis.on('error', (err) => {
      console.warn('Redis client error:', err.message)
      redis = null
    })
    redis.on('end', () => {
      redis = null
    })
    await redis.connect()
  }
  return redis
}

export function createServerCache({ maxAge }: { maxAge: number }) {
  return {
    async set(key: string, value: string) {
      try {
        const client = await getRedis()
        const namespacedKey = `${API_REDIS_PREFIX}${key}`
        await client.set(namespacedKey, value, { PX: maxAge })
      } catch (err) {
        console.warn('Redis set failed, skipping cache write:', err.message)
      }
    },
    async get(key: string) {
      try {
        const client = await getRedis()
        const namespacedKey = `${API_REDIS_PREFIX}${key}`
        const cached = await client.get(namespacedKey)
        return cached ? JSON.parse(cached) : null
      } catch (err) {
        console.warn('Redis get failed, skipping cache read:', err.message)
        return null
      }
    },
    async has(key: string) {
      try {
        const client = await getRedis()
        const namespacedKey = `${API_REDIS_PREFIX}${key}`
        return (await client.exists(namespacedKey)) === 1
      } catch (err) {
        console.warn('Redis has failed, skipping cache check:', err.message)
        return false
      }
    },
    async delete(key: string) {
      try {
        const client = await getRedis()
        const namespacedKey = `${API_REDIS_PREFIX}${key}`
        await client.del(namespacedKey)
      } catch (err) {
        console.warn('Redis delete failed:', err.message)
      }
    },
    async clear() {
      try {
        const client = await getRedis()
        const keys = await client.keys(`${API_REDIS_PREFIX}*`)
        if (keys.length > 0) await client.del(keys)
      } catch (err) {
        console.warn('Redis clear failed:', err.message)
      }
    },
  }
}
