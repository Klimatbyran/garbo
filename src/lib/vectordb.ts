import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import OpenAI from 'openai'

import config from '../config/chromadb'
import openaiConfig from '../config/openai'

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

// Limit concurrent ChromaDB queries to prevent HNSW searches from overwhelming
// the server. Under K8s CPU limits all 10+ follow-up workers fire simultaneously;
// without this they all queue in ChromaDB's thread pool, starve each other of
// CPU, and time out before any response is sent.
const CHROMA_CONCURRENCY = config.concurrency
let activeChromaQueries = 0
const chromaQueryWaiters: (() => void)[] = []

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

    await collection.add({
      ids: batchIds,
      metadatas: batchMetadatas,
      documents: batchChunks.map(({ chunk }) => chunk),
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
  log(`Generating embeddings (${queryTexts.length} query texts)`)
  const embeddingResponse = await openaiClient.embeddings.create({
    model: config.embeddingModel,
    input: queryTexts,
  })
  const queryEmbeddings = embeddingResponse.data.map((e) => e.embedding)

  log(
    `Waiting for ChromaDB slot (concurrency=${CHROMA_CONCURRENCY}, active=${activeChromaQueries})...`
  )
  return withChromaLimit(async () => {
    log(`Querying ChromaDB`)
    const result = await collection.query({
      nResults,
      where: { source: url },
      queryEmbeddings,
    })
    log(`ChromaDB query complete`)

    const metadatas = result.metadatas.flat()
    const paragraphs = metadatas.map((metadata) => metadata?.paragraph || '')
    const uniqueParagraphs = Array.from(new Set(paragraphs))

    return uniqueParagraphs.join('\n\n')
  })
}

/**
 * Delete a specific report
 */
function deleteReport(url: string) {
  return collection.delete({ where: { source: url } })
}

/**
 * Clear all reports. Useful during development.
 */
function clearAllReports() {
  return collection.delete({ where: { type: reportMetadataType } })
}

export const vectorDB = {
  addReport,
  hasReport,
  deleteReport,
  getRelevantMarkdown,
  clearAllReports,
}
