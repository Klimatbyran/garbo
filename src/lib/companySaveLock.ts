import { randomUUID } from 'node:crypto'
import { createClient, type RedisClientType } from 'redis'
import redisConfig from '../config/redis'

const LOCK_KEY_PREFIX = 'garbo:company-save-lock:'
const LOCK_TTL_MS = 10 * 60 * 1000
const POLL_INTERVAL_MS = 500
const MAX_WAIT_MS = 15 * 60 * 1000

const redisUrl = `redis://default:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`

let client: RedisClientType | null = null

async function getRedis(): Promise<RedisClientType> {
  if (!client || !client.isOpen) {
    client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: false,
      },
    })
    client.on('error', (err) => {
      console.warn('companySaveLock Redis error:', err.message)
      client = null
    })
    client.on('end', () => {
      client = null
    })
    await client.connect()
  }
  return client
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Serialize API saves per company so concurrent pipeline runs for the same
 * wikidataId do not interleave registry / CompanyReport / period writes.
 */
export async function withCompanySaveLock<T>(
  wikidataId: string,
  run: () => Promise<T>
): Promise<T> {
  const key = `${LOCK_KEY_PREFIX}${wikidataId.trim()}`
  const token = randomUUID()
  const redis = await getRedis()
  const waitStartedAt = Date.now()

  while (true) {
    const acquired = await redis.set(key, token, { NX: true, PX: LOCK_TTL_MS })
    if (acquired) break

    if (Date.now() - waitStartedAt > MAX_WAIT_MS) {
      throw new Error(
        `Timed out waiting for company save lock (${wikidataId}) after ${MAX_WAIT_MS}ms`
      )
    }
    await sleep(POLL_INTERVAL_MS)
  }

  try {
    return await run()
  } finally {
    try {
      const current = await redis.get(key)
      if (current === token) {
        await redis.del(key)
      }
    } catch (err) {
      console.warn('companySaveLock release failed:', err)
    }
  }
}
