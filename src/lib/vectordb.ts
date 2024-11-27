import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'

import chromadb from '../config/chromadb'
import openai from '../config/openai'

const client = new ChromaClient(chromadb)
const embedder = new OpenAIEmbeddingFunction(openai)

const collection = await client.getOrCreateCollection({
  name: 'emission_reports',
  embeddingFunction: embedder,
})

async function addReport(url: string, chunks: string[]) {
  const ids = chunks.map((_, i) => url + '#' + i)
  const metadatas = chunks.map((chunk, i) => ({
    source: url,
    markdown: chunk,
    type: 'company_sustainability_report', // this is our own type to be able to filter in the future if needed
    parsed: new Date().toISOString(),
    page: i,
  }))
  await collection.add({
    ids,
    metadatas,
    documents: chunks,
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

  const markdown = result.documents.join('\n\n')
  return markdown
}

export const vectorDB = {
  addReport,
  hasReport,
  getRelevantMarkdown,
}
