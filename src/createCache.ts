import { createClient } from 'redis'
import redisConfig from './config/redis'

const redis = createClient({ ...redisConfig })
redis.connect()

export function createServerCache({ maxAge }: { maxAge: number }) {
  return {
    async set(key: string, value: any) {
      await redis.set(key, JSON.stringify(value), {
        PX: maxAge,
      })
    },
    async get(key: string) {
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached) : null
    },
    async has(key: string) {
      return (await redis.exists(key)) === 1
    },
    async delete(key: string) {
      await redis.del(key)
    },
    async clear() {
      const keys = await redis.keys('*')
      if (keys.length > 0) await redis.del(keys)
    },
  }
}
