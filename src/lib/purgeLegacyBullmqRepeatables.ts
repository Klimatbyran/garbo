import IORedis from 'ioredis'
import redisConfig from '../config/redis'
import { hasLegacyRepeatableKeyShape } from './bullmqLegacyRepeatableKey'

/**
 * BullMQ 6 throws from `getJobSchedulers()` when pre-v6 `bull:<queue>:repeat:*`
 * metadata is still in Redis. Delete only legacy-shaped keys before registering
 * Job Schedulers — never wipe v6 scheduler hashes (`repeat:<schedulerId>`),
 * which share the same key prefix.
 */
export async function purgeLegacyBullmqRepeatables(
  queueName: string
): Promise<number> {
  const client = new IORedis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    // ioredis 6 defaults to RESP3; keep RESP2 for Redis/BullMQ Lua compatibility.
    protocol: 2,
  })
  try {
    await client.connect()
    const prefix = `bull:${queueName}:repeat:`
    const pattern = `${prefix}*`
    let deleted = 0
    let cursor = '0'
    do {
      const [next, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      )
      cursor = next
      const legacyKeys = keys.filter((key) => {
        const suffix = key.startsWith(prefix) ? key.slice(prefix.length) : key
        return hasLegacyRepeatableKeyShape(suffix)
      })
      if (legacyKeys.length > 0) {
        deleted += await client.del(...legacyKeys)
      }
    } while (cursor !== '0')
    return deleted
  } finally {
    client.disconnect()
  }
}
