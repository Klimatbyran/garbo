import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'

import chromadb from '../config/chromadb'
import openai from '../config/openai'

const client = new ChromaClient(chromadb)
const embedder = new OpenAIEmbeddingFunction(openai)

const collection = await client.getOrCreateCollection({
  name: 'emission_reports',
  embeddingFunction: embedder,
})

async function addReport(url: string, paragraphs: string[]) {
  const chunkSize = 2000
  const overlapSize = 200

  const chunks: { chunk: string; paragraph: string }[] = []

  paragraphs.forEach((paragraph) => {
    for (let i = 0; i < paragraph.length; i += chunkSize - overlapSize) {
      const chunk = paragraph.slice(i, i + chunkSize).trim()
      if (chunk.length > 0) {
        chunks.push({ chunk, paragraph })
      }
    }
  })

  const ids = chunks.map((_, i) => `${url}#${i}`)
  const metadatas = chunks.map(({ paragraph }) => ({
    source: url,
    paragraph,
    type: 'company_sustainability_report',
    parsed: new Date().toISOString(),
  }))

  await collection.add({
    ids,
    metadatas,
    documents: chunks.map(({ chunk }) => chunk),
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

export const vectorDB = {
  addReport,
  hasReport,
  getRelevantMarkdown,
}
