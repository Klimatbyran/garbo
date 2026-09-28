import { randomUUID } from 'node:crypto'
import { createClient, type RedisClientType } from 'redis'
import redisConfig from '../config/redis'

const LOCK_KEY = 'garbo:pipeline-auto-run:tick-lock'
/** Longer than a slow tick; shorter than several missed repeat intervals. */
const LOCK_TTL_MS = 3 * 60 * 1000

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
      console.warn('pipelineAutoRunLock Redis error:', err.message)
      client = null
    })
    client.on('end', () => {
      client = null
    })
    await client.connect()
  }
  return client
}

/**
 * Run `fn` only if no other worker holds the auto-run tick lock.
 * Non-blocking: if the lock is held, returns `{ acquired: false }` immediately
 * so overlapping repeatable ticks / multi-replica workers cannot double-enqueue.
 */
export async function tryWithPipelineAutoRunTickLock<T>(
  fn: () => Promise<T>
): Promise<{ acquired: true; result: T } | { acquired: false }> {
  const token = randomUUID()
  let redis: RedisClientType
  try {
    redis = await getRedis()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`pipeline-auto-run tick lock unavailable: ${message}`)
  }

  const acquired = await redis.set(LOCK_KEY, token, {
    NX: true,
    PX: LOCK_TTL_MS,
  })
  if (!acquired) {
    return { acquired: false }
  }

  try {
    return { acquired: true, result: await fn() }
  } finally {
    try {
      const current = await redis.get(LOCK_KEY)
      if (current === token) {
        await redis.del(LOCK_KEY)
      }
    } catch (err) {
      console.warn('pipelineAutoRunLock release failed:', err)
    }
  }
}
