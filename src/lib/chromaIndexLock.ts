import { createHash, randomUUID } from 'node:crypto'
import { createClient, type RedisClientType } from 'redis'
import redisConfig from '../config/redis'

// One Redis lock per report URL while its chunks are being written to Chroma.
// Indexing takes the lock; searches wait for it, so no worker (in any pod)
// reads a report that is only partly written.

/** Refreshed after every batch, so it only expires if the indexing worker dies. */
const LOCK_TTL_MS = 5 * 60 * 1000
const POLL_MS = 1_000
/** Give up waiting after this long and continue (the lock holder is probably stuck). */
const MAX_WAIT_MS = 30 * 60 * 1000

let client: RedisClientType | null = null

async function getRedis(): Promise<RedisClientType> {
  if (!client || !client.isOpen) {
    client = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        connectTimeout: 2_000,
        reconnectStrategy: false,
      },
      ...(redisConfig.password ? { password: redisConfig.password } : {}),
    })
    client.on('error', (err) => {
      console.warn('chromaIndexLock Redis error:', err.message)
      client = null
    })
    client.on('end', () => {
      client = null
    })
    await client.connect()
  }
  return client
}

function lockKey(url: string) {
  return `garbo:chroma:indexing:${createHash('sha1').update(url).digest('hex')}`
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Runs `fn` while holding the indexing lock for `url`, waiting for another
 * worker's lock first. Call `refresh` regularly during long writes.
 */
export async function withChromaIndexLock<T>(
  url: string,
  log: (msg: string) => void,
  fn: (refresh: () => Promise<void>) => Promise<T>
): Promise<T> {
  const key = lockKey(url)
  const token = randomUUID()
  const redis = await getRedis()

  const started = Date.now()
  let loggedWait = false
  while (!(await redis.set(key, token, { NX: true, PX: LOCK_TTL_MS }))) {
    if (Date.now() - started > MAX_WAIT_MS) {
      throw new Error(`Timed out waiting for Chroma indexing lock on ${url}`)
    }
    if (!loggedWait) {
      log(`Another worker is indexing ${url} in Chroma; waiting`)
      loggedWait = true
    }
    await sleep(POLL_MS)
  }

  const refresh = async () => {
    if ((await redis.get(key)) === token) await redis.pExpire(key, LOCK_TTL_MS)
  }

  try {
    return await fn(refresh)
  } finally {
    try {
      if ((await redis.get(key)) === token) await redis.del(key)
    } catch (err) {
      console.warn('chromaIndexLock release failed:', err)
    }
  }
}

/** Resolves once no worker is indexing `url`. */
export async function waitForChromaIndexing(
  url: string,
  log: (msg: string) => void
): Promise<void> {
  const key = lockKey(url)
  const redis = await getRedis()
  const started = Date.now()
  let loggedWait = false
  while (await redis.exists(key)) {
    if (Date.now() - started > MAX_WAIT_MS) {
      log(`Still waiting on Chroma indexing lock for ${url}; searching anyway`)
      return
    }
    if (!loggedWait) {
      log(`Waiting for ${url} to finish indexing in Chroma`)
      loggedWait = true
    }
    await sleep(POLL_MS)
  }
}
