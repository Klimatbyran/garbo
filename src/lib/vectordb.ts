import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import OpenAI from 'openai'

import config from '../config/chromadb'
import openaiConfig from '../config/openai'
import {
  pageNumberForMarkdownSnippet,
  type DoclingPageSnippet,
} from './doclingPageLookup'

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

export type RetrievedParagraph = {
  text: string
  pageNumber?: number
}

// Cap concurrent Chroma HTTP calls per worker (queries + per-batch adds). BullMQ
// runs many jobs at once; one Chroma pod cannot (HNSW/thread pool for query, SQLite
// locks on add). Extra callers wait on a semaphore. Each pod has its own cap.
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

async function withChromaRetry<T>(
  fn: () => Promise<T>,
  log: (msg: string) => void,
  maxRetries = 5
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === maxRetries) break
      const jitter = Math.floor(Math.random() * 1000)
      const delayMs = 1000 * Math.pow(2, attempt - 1) + jitter
      log(
        `ChromaDB attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms: ${err}`
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw lastError
}

async function addReport(
  url: string,
  markdown: string,
  log: (msg: string) => void = console.log,
  pageSnippets: DoclingPageSnippet[] = []
) {
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

  const documentChunks: {
    chunk: string
    paragraph: string
    pageNumber?: number
  }[] = []

  let pagesResolved = 0
  mergedParagraphs.forEach((paragraph) => {
    const paragraphPage = pageNumberForMarkdownSnippet(paragraph, pageSnippets)
    for (let i = 0; i < paragraph.length; i += config.chunkSize - overlapSize) {
      const chunk = paragraph.slice(i, i + config.chunkSize).trim()
      if (chunk.length > 0) {
        const pageNumber =
          pageNumberForMarkdownSnippet(chunk, pageSnippets) ?? paragraphPage
        if (pageNumber !== undefined) pagesResolved++
        documentChunks.push({ chunk, paragraph, pageNumber })
      }
    }
  })

  if (pageSnippets.length > 0) {
    log(
      `Page lookup: matched ${pagesResolved}/${documentChunks.length} chunks from ${pageSnippets.length} Docling snippets`
    )
  }

  // Process in batches of 50 chunks to avoid token limit issues
  const batchSize = 50
  for (let i = 0; i < documentChunks.length; i += batchSize) {
    const batchChunks = documentChunks.slice(i, i + batchSize)
    const batchIds = batchChunks.map((_, j) => `${url}#${i + j}`)
    const batchMetadatas = batchChunks.map(({ paragraph, pageNumber }) => ({
      source: url,
      paragraph,
      type: reportMetadataType,
      parsed: new Date().toISOString(),
      ...(pageNumber !== undefined ? { pageNumber } : {}),
    }))

    await withChromaLimit(async () => {
      await withChromaRetry(
        () =>
          collection.add({
            ids: batchIds,
            metadatas: batchMetadatas,
            documents: batchChunks.map(({ chunk }) => chunk),
          }),
        log
      )
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

async function getRelevantParagraphs(
  url: string,
  queryTexts: string[],
  nResults = 10,
  log: (msg: string) => void = console.log
): Promise<RetrievedParagraph[]> {
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
    const unique = new Map<string, RetrievedParagraph>()

    for (const metadata of metadatas) {
      const text =
        typeof metadata?.paragraph === 'string' ? metadata.paragraph : ''
      if (!text || unique.has(text)) continue

      const rawPage = metadata?.pageNumber
      const pageNumber =
        typeof rawPage === 'number'
          ? rawPage
          : typeof rawPage === 'string' && /^\d+$/.test(rawPage)
            ? Number.parseInt(rawPage, 10)
            : undefined

      unique.set(text, {
        text,
        ...(pageNumber !== undefined && Number.isFinite(pageNumber)
          ? { pageNumber }
          : {}),
      })
    }

    return Array.from(unique.values())
  })
}

async function getRelevantMarkdown(
  url: string,
  queryTexts: string[],
  nResults = 10,
  log: (msg: string) => void = console.log
) {
  const paragraphs = await getRelevantParagraphs(url, queryTexts, nResults, log)
  return paragraphs.map((paragraph) => paragraph.text).join('\n\n')
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
  getRelevantParagraphs,
  clearAllReports,
}
