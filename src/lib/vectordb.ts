import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import OpenAI from 'openai'
import { createClient, RedisClientType } from 'redis'
import { gzipSync, gunzipSync } from 'node:zlib'

import config from '../config/chromadb'
import openaiConfig from '../config/openai'
import redisConfig from '../config/redis'
import {
  buildEmbeddingCacheKey,
  buildRetrievalCacheKey,
  normalizeQueryTexts,
  sha256,
  shouldCachePayload,
} from './vectorCacheKeys'

const client = new ChromaClient(config)
const embedder = new OpenAIEmbeddingFunction({
  ...openaiConfig,
  openai_model: config.embeddingModel,
})
const openaiClient = new OpenAI({ apiKey: openaiConfig.apiKey })

const collection = await client.getOrCreateCollection({
  name: 'emission_reports',
  embeddingFunction: embedder,
})

// this is our own type to be able to filter in the future if needed
const reportMetadataType = 'company_sustainability_report'

// Cap concurrent Chroma HTTP calls per worker (queries + per-batch adds). BullMQ
// runs many jobs at once; one Chroma pod cannot (HNSW/thread pool for query, SQLite
// locks on add). Extra callers wait on a semaphore. Each pod has its own cap.
const CHROMA_CONCURRENCY = config.concurrency
let activeChromaQueries = 0
const chromaQueryWaiters: (() => void)[] = []

const VECTOR_REDIS_PREFIX = 'redis_vdb/'
const inFlightRetrievals = new Map<string, Promise<string>>()

type EmbeddingVector = number[]
type EmbeddingResponseData = { embedding: EmbeddingVector }[]

let redis: RedisClientType | null = null

const cacheStats = {
  retrievalHits: 0,
  retrievalMisses: 0,
  embeddingHits: 0,
  embeddingMisses: 0,
  dedupWaits: 0,
  compressedWrites: 0,
  skippedByPayload: 0,
  redisReadErrors: 0,
  redisWriteErrors: 0,
}

function toSeconds(ms: number): number {
  return Math.max(1, Math.floor(ms / 1000))
}

function elapsedMs(start: number): number {
  return Date.now() - start
}

function safeLog(log: (msg: string) => void, message: string) {
  try {
    log(message)
  } catch {
    // Never let logging failures affect worker execution.
  }
}

function encodeCacheValue(value: string): string {
  const payloadBytes = Buffer.byteLength(value, 'utf8')
  const shouldCompress =
    config.cacheEnableCompression &&
    payloadBytes >= config.cacheCompressionMinBytes

  if (!shouldCompress) {
    return value
  }

  const compressed = gzipSync(value)
  cacheStats.compressedWrites++
  return `gz:${compressed.toString('base64')}`
}

function decodeCacheValue(value: string): string {
  if (!value.startsWith('gz:')) {
    return value
  }

  const encoded = value.slice(3)
  const decompressed = gunzipSync(Buffer.from(encoded, 'base64'))
  return decompressed.toString('utf8')
}

async function getRedis(): Promise<RedisClientType | null> {
  if (redis?.isOpen) {
    return redis
  }

  try {
    const password = redisConfig.password ?? ''
    const auth = password ? `default:${password}@` : ''
    const url = `redis://${auth}${redisConfig.host}:${redisConfig.port}`

    redis = createClient({
      url,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: false,
      },
    })

    redis.on('error', (err) => {
      console.warn('Vector cache Redis error:', err.message)
      redis = null
    })

    redis.on('end', () => {
      redis = null
    })

    await redis.connect()
    return redis
  } catch (error) {
    console.warn(
      'Vector cache Redis unavailable, continuing uncached:',
      (error as Error)?.message ?? String(error)
    )
    redis = null
    return null
  }
}

async function cacheGet(key: string): Promise<string | null> {
  try {
    const client = await getRedis()
    if (!client) {
      return null
    }
    const value = await client.get(`${VECTOR_REDIS_PREFIX}${key}`)
    if (!value) {
      return null
    }
    return decodeCacheValue(value)
  } catch (error) {
    cacheStats.redisReadErrors++
    console.warn('Vector cache read failed:', (error as Error).message)
    return null
  }
}

async function cacheSet(
  key: string,
  value: string,
  ttlMs: number
): Promise<void> {
  try {
    const client = await getRedis()
    if (!client) {
      return
    }
    await client.set(`${VECTOR_REDIS_PREFIX}${key}`, encodeCacheValue(value), {
      EX: toSeconds(ttlMs),
    })
  } catch (error) {
    cacheStats.redisWriteErrors++
    console.warn('Vector cache write failed:', (error as Error).message)
  }
}

async function cacheDelete(key: string): Promise<void> {
  try {
    const client = await getRedis()
    if (!client) {
      return
    }
    await client.del(`${VECTOR_REDIS_PREFIX}${key}`)
  } catch (error) {
    console.warn('Vector cache delete failed:', (error as Error).message)
  }
}

function reportVersionKey(url: string): string {
  return `report-version:${sha256(url)}`
}

async function getReportVersion(url: string): Promise<string> {
  const key = reportVersionKey(url)
  const value = await cacheGet(key)
  return value || '0'
}

async function setReportVersion(url: string, version: string): Promise<void> {
  await cacheSet(reportVersionKey(url), version, 45 * 24 * 60 * 60 * 1000)
}

async function getQueryEmbeddings(
  queryTexts: string[],
  log: (msg: string) => void
): Promise<EmbeddingVector[]> {
  const normalizedQueryTexts = normalizeQueryTexts(queryTexts)
  const embeddingCacheKey = buildEmbeddingCacheKey({
    schemaVersion: config.cacheSchemaVersion,
    embeddingModel: config.embeddingModel,
    normalizedQueryTexts,
  })

  const cached = await cacheGet(embeddingCacheKey)
  if (cached) {
    cacheStats.embeddingHits++
    safeLog(log, `Embedding cache hit (${queryTexts.length} query texts)`)
    try {
      const parsed = JSON.parse(cached) as EmbeddingResponseData
      return parsed.map((e) => e.embedding)
    } catch {
      await cacheDelete(embeddingCacheKey)
    }
  }

  cacheStats.embeddingMisses++

  safeLog(log, `Generating embeddings (${queryTexts.length} query texts)`)
  const embeddingResponse = await openaiClient.embeddings.create({
    model: config.embeddingModel,
    input: normalizedQueryTexts,
  })

  await cacheSet(
    embeddingCacheKey,
    JSON.stringify(embeddingResponse.data),
    config.embeddingCacheTtlMs
  )

  return embeddingResponse.data.map((e) => e.embedding)
}

async function withChromaLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (activeChromaQueries >= CHROMA_CONCURRENCY) {
    console.debug(
      `ChromaDB at capacity (${activeChromaQueries}/${CHROMA_CONCURRENCY}), queuing request...`
    )
    await new Promise<void>((resolve) => chromaQueryWaiters.push(resolve))
  }
  activeChromaQueries++
  try {
    return await fn()
  } finally {
    activeChromaQueries--
    chromaQueryWaiters.shift()?.()
  }
}

async function addReport(url: string, markdown: string) {
  const overlapSize = 200

  const paragraphs = markdown
    .split('\n##')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  let prefix = ''
  const mergedParagraphs: string[] = []

  // Combine standalone headers (titles without body) with the next paragraph that has a body.
  for (let i = 0; i < paragraphs.length; i++) {
    const current = paragraphs[i]
    const hasBody = current.split('\n').length > 1

    if (!hasBody) {
      prefix += (prefix ? '\n' : '') + current
    } else {
      mergedParagraphs.push((prefix ? prefix + '\n' : '') + current)
      prefix = ''
    }
  }

  if (prefix) {
    mergedParagraphs.push(prefix)
  }

  const documentChunks: { chunk: string; paragraph: string }[] = []

  mergedParagraphs.forEach((paragraph) => {
    for (let i = 0; i < paragraph.length; i += config.chunkSize - overlapSize) {
      const chunk = paragraph.slice(i, i + config.chunkSize).trim()
      if (chunk.length > 0) {
        documentChunks.push({ chunk, paragraph })
      }
    }
  })

  // Process in batches of 50 chunks to avoid token limit issues
  const batchSize = 50
  for (let i = 0; i < documentChunks.length; i += batchSize) {
    const batchChunks = documentChunks.slice(i, i + batchSize)
    const batchIds = batchChunks.map((_, j) => `${url}#${i + j}`)
    const batchMetadatas = batchChunks.map(({ paragraph }) => ({
      source: url,
      paragraph,
      type: reportMetadataType,
      parsed: new Date().toISOString(),
    }))

    await withChromaLimit(async () => {
      await collection.add({
        ids: batchIds,
        metadatas: batchMetadatas,
        documents: batchChunks.map(({ chunk }) => chunk),
      })
    })

    // Optional: Add a small delay between batches to avoid rate limiting
    if (i + batchSize < documentChunks.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

async function hasReport(url: string) {
  return collection
    .get({
      where: { source: url },
      limit: 1,
    })
    .then((r) => r?.documents?.length > 0)
}

async function getRelevantMarkdown(
  url: string,
  queryTexts: string[],
  nResults = 10,
  log: (msg: string) => void = console.log
) {
  const totalStart = Date.now()
  const normalizedQueryTexts = normalizeQueryTexts(queryTexts)
  const reportVersion = await getReportVersion(url)
  const retrievalKey = buildRetrievalCacheKey({
    schemaVersion: config.cacheSchemaVersion,
    reportVersion,
    url,
    embeddingModel: config.embeddingModel,
    nResults,
    normalizedQueryTexts,
  })

  const cacheReadStart = Date.now()
  const cached = await cacheGet(retrievalKey)
  const cacheReadMs = elapsedMs(cacheReadStart)
  if (cached) {
    cacheStats.retrievalHits++
    safeLog(log, `Retrieval cache hit (${cacheReadMs}ms)`)
    safeLog(log, `VectorDB timing total=${elapsedMs(totalStart)}ms`)
    return cached
  }

  cacheStats.retrievalMisses++

  const inFlight = inFlightRetrievals.get(retrievalKey)
  if (inFlight) {
    cacheStats.dedupWaits++
    safeLog(log, 'Waiting for in-flight retrieval result')
    const result = await inFlight
    safeLog(log, `VectorDB timing dedup_wait_total=${elapsedMs(totalStart)}ms`)
    return result
  }

  const retrievalPromise = (async () => {
    const embeddingStart = Date.now()
    const queryEmbeddings = await getQueryEmbeddings(normalizedQueryTexts, log)
    const embeddingMs = elapsedMs(embeddingStart)

    safeLog(
      log,
      `Waiting for ChromaDB slot (concurrency=${CHROMA_CONCURRENCY}, active=${activeChromaQueries})...`
    )

    const chromaStart = Date.now()
    const markdown = await withChromaLimit(async () => {
      safeLog(log, 'Querying ChromaDB')
      const result = await collection.query({
        nResults,
        where: { source: url },
        queryEmbeddings,
      })
      safeLog(log, 'ChromaDB query complete')

      const metadatas = result.metadatas.flat()
      const paragraphs = metadatas.map((metadata) => metadata?.paragraph || '')
      const uniqueParagraphs = Array.from(new Set(paragraphs))

      return uniqueParagraphs.join('\n\n')
    })
    const chromaMs = elapsedMs(chromaStart)

    const cacheWriteStart = Date.now()
    if (shouldCachePayload(markdown, config.cacheMaxPayloadBytes)) {
      await cacheSet(retrievalKey, markdown, config.retrievalCacheTtlMs)
    } else {
      cacheStats.skippedByPayload++
      const payloadBytes = Buffer.byteLength(markdown, 'utf8')
      safeLog(
        log,
        `Skipping retrieval cache write (${payloadBytes} bytes > max ${config.cacheMaxPayloadBytes})`
      )
    }
    const cacheWriteMs = elapsedMs(cacheWriteStart)

    safeLog(
      log,
      `VectorDB timing cache_read=${cacheReadMs}ms embedding=${embeddingMs}ms chroma=${chromaMs}ms cache_write=${cacheWriteMs}ms total=${elapsedMs(totalStart)}ms`
    )

    return markdown
  })()

  inFlightRetrievals.set(retrievalKey, retrievalPromise)

  try {
    return await retrievalPromise
  } finally {
    inFlightRetrievals.delete(retrievalKey)
  }
}

/**
 * Delete a specific report
 */
function deleteReport(url: string) {
  return collection.delete({ where: { source: url } })
}

async function invalidateReportCache(url: string) {
  await setReportVersion(url, Date.now().toString())
}

/**
 * Clear all reports. Useful during development.
 */
function clearAllReports() {
  return collection.delete({ where: { type: reportMetadataType } })
}

function getVectorCacheStats() {
  return {
    ...cacheStats,
    inFlightRetrievals: inFlightRetrievals.size,
  }
}

function resetVectorCacheStats() {
  for (const key of Object.keys(cacheStats) as (keyof typeof cacheStats)[]) {
    cacheStats[key] = 0
  }
}

export const vectorDB = {
  addReport,
  hasReport,
  deleteReport,
  invalidateReportCache,
  getRelevantMarkdown,
  clearAllReports,
  getVectorCacheStats,
  resetVectorCacheStats,
}
