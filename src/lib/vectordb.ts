import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'

import chromadb from '../config/chromadb'
import openai from '../config/openai'
import { CHUNK_SIZE } from '../config'

const client = new ChromaClient(chromadb)
const embedder = new OpenAIEmbeddingFunction(openai)

const collection = await client.getOrCreateCollection({
  name: 'emission_reports',
  embeddingFunction: embedder,
})

// this is our own type to be able to filter in the future if needed
const reportMetadataType = 'company_sustainability_report'

async function addReport(url: string, markdown: string) {
  const overlapSize = 200

  const paragraphs = markdown
    .split('\n##')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  let prefix = ''
  const mergedParagraphs: string[] = []

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
    for (let i = 0; i < paragraph.length; i += CHUNK_SIZE - overlapSize) {
      const chunk = paragraph.slice(i, i + CHUNK_SIZE).trim()
      if (chunk.length > 0) {
        documentChunks.push({ chunk, paragraph })
      }
    }
  })

  const ids = documentChunks.map((_, i) => `${url}#${i}`)
  const metadatas = documentChunks.map(({ paragraph }) => ({
    source: url,
    paragraph,
    type: reportMetadataType,
    parsed: new Date().toISOString(),
  }))

  await collection.add({
    ids,
    metadatas,
    documents: documentChunks.map(({ chunk }) => chunk),
  })
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
  nResults = 10
) {
  /* might get better results if we query for imaginary results from a query instead of the actual query
  const query = await ask([
    {
      role: 'user',
      content:
        'Please give me some example data from this prompt that I can use as search query in a vector database indexed from PDFs. OK?'
    },
    {role: 'assistant', content: 'OK sure, give '},
        prompt,
    },
  ])*/
  const result = await collection.query({
    nResults,
    where: {
      source: url,
    },
    queryTexts,
  })

  const metadatas = result.metadatas.flat()
  const paragraphs = metadatas.map((metadata) => metadata?.paragraph || '')
  const uniqueParagraphs = Array.from(new Set(paragraphs))

  return uniqueParagraphs.join('\n\n')
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
