import IORedis from 'ioredis'
import redisConfig from '../config/redis'

/**
 * BullMQ 6 throws from `getJobSchedulers()` when pre-v6 `bull:<queue>:repeat:*`
 * metadata is still in Redis. Delete those keys with a short-lived ioredis
 * client before registering Job Schedulers.
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
  })
  try {
    await client.connect()
    const pattern = `bull:${queueName}:repeat:*`
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
      if (keys.length > 0) {
        deleted += await client.del(...keys)
      }
    } while (cursor !== '0')
    return deleted
  } finally {
    client.disconnect()
  }
}
