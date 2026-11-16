import IORedis from 'ioredis'
import redisConfig from '../config/redis'
import { hasLegacyRepeatableKeyShape } from './bullmqLegacyRepeatableKey'

/**
 * BullMQ 6 throws from `getJobSchedulers()` when pre-v6 repeatable job
 * *members* remain in the `bull:<queue>:repeat` sorted set.
 *
 * Cleanup:
 * 1. Scan ZSET members; remove legacy-shaped entries and their metadata hashes
 *    (hashes without the v6-only `ic` field).
 * 2. Delete any leftover legacy hash keys under `bull:<queue>:repeat:*` that
 *    match the legacy shape (belt-and-braces for orphaned hashes).
 *
 * Never delete v6 Job Scheduler hashes (`ic` present) or delayed job keys
 * (`<schedulerId>:<millis>`).
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
    protocol: 2,
  })
  try {
    await client.connect()
    const repeatZset = `bull:${queueName}:repeat`
    const prefix = `${repeatZset}:`
    let deleted = 0

    const members = await client.zrange(repeatZset, 0, -1)
    for (const member of members) {
      if (!hasLegacyRepeatableKeyShape(member)) continue
      const hashKey = `${prefix}${member}`
      // v6 schedulers always write `ic` (iteration count). Legacy repeatables do not.
      const isV6Scheduler = (await client.hexists(hashKey, 'ic')) === 1
      if (isV6Scheduler) continue
      deleted += await client.zrem(repeatZset, member)
      deleted += await client.del(hashKey)
    }

    let cursor = '0'
    do {
      const [next, keys] = await client.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        100
      )
      cursor = next
      const legacyKeys: string[] = []
      for (const key of keys) {
        const suffix = key.startsWith(prefix) ? key.slice(prefix.length) : key
        if (!hasLegacyRepeatableKeyShape(suffix)) continue
        if ((await client.hexists(key, 'ic')) === 1) continue
        legacyKeys.push(key)
      }
      if (legacyKeys.length > 0) {
        deleted += await client.del(...legacyKeys)
      }
    } while (cursor !== '0')

    return deleted
  } finally {
    client.disconnect()
  }
}
