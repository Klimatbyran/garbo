import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import chromadb from '../config/chromadb'
import { askStream } from '../openai'

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})

class JobData extends Job {
  declare data: {
    documentId: string
    url: string
    prompt: string
    threadId: string
    json: string
    previousAnswer: string
    previousError: string
  }
}

const worker = new Worker(
  'followUp',
  async (job: JobData) => {
    const { prompt, url, json, previousAnswer, previousError } = job.data

    const client = new ChromaClient(chromadb)
    const collection = await client.getCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })
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

    const results = await collection.query({
      nResults: 5,
      where: {
        source: url,
      },
      queryTexts: [prompt],
    })
    const pdfParagraphs = results.documents.flat()

    job.log(`Reflecting on: ${prompt}
    ${json}
    
    Context:
    ${pdfParagraphs.join('\n\n----------------\n\n')}
    
    `)

    let progress = 0
    const response = await askStream(
      [
        {
          role: 'system',
          content:
            'You are an expert in CSRD and will provide accurate data from a PDF with company CSRD reporting. Be consise and accurate.',
        },
        {
          role: 'user',
          content:
            'Results from PDF: \n' +
            pdfParagraphs.join('\n\n------------------------------\n\n'),
        },
        {
          role: 'user',
          content: `This is the result of a previous prompt:


\`\`\`json
${json}
\`\`\`

## Please add diffs to the prompt based on the instructions:
${prompt}

## Output:
For example, if you want to add a new field called "industry" the response should look like this:
\`\`\`json
{
  "industry": {...}
}
\`\`\``,
        },
        { role: 'asistant', content: previousAnswer },
        { role: 'user', content: previousError },
      ].filter((m) => m.content) as any[]
    )

    job.log('Response: ' + response)
    const output = response.match(/```json([\s\S]*?)```/)?.[1] || response

    try {
      const parsedJson = output ? JSON.parse(output) : {} // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry
      return JSON.stringify(parsedJson, null, 2)
    } catch (error) {
      job.updateData({
        ...job.data,
        previousAnswer: output,
        previousError: error.message,
      })
    }
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
