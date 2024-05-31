import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import { searchCompany } from '../lib/wikidata'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

const ask = async (prompt: string, context: string) => {
  console.log(ask, prompt, context)
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are an expert in corporate reporting. Be concise and accurate.',
      },
      { role: 'user', content: prompt },
      { role: 'assistant', content: 'Sure! Just send me the context?' },
      { role: 'user', content: context },
    ],
    model: 'gpt-4o',
    stream: false,
  })

  return response.choices[0].message.content
}

class JobData extends Job {
  declare data: {
    url: string
    companyName: string
    previousAnswer: string
    threadId: string
    paragraphs: string
    previousError: string
  }
}

const worker = new Worker(
  'guessWikidata',
  async (job: JobData) => {
    const { previousError, previousAnswer, paragraphs } = job.data
    const companyName = await ask(
      'What is the name of the company? Respond only with the company name. We will search Wikidata after this name',
      paragraphs
    )
    const prompt = `Please choose the appropriate wikidata node and return it as json. For example:

\`\`\`json
{
  "node": "Q123456",
  "url": "//www.wikidata.org/wiki/Q123456",
  "logo": "https://commons.wikimedia.org/wiki/File:Example.jpg",
  "label": "Company Name",
  "description": "Company Description",
}
\`\`\`
`

    const results = await searchCompany(companyName)

    if (results.length === 0) {
      return JSON.stringify({ error: 'No wikidata page found' }, null, 2)
    }

    if (results.length === 1) {
      return JSON.stringify(results[0], null, 2)
    }

    const stream = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `I have a company named ${companyName}. I want to generate a wikidata query for it. Please help me select the appropriate node id based on the query below. I'll include the context from a PDF with the company's yearly report to help you select the correct one.`,
        },
        { role: 'user', content: paragraphs },
        { role: 'user', content: JSON.stringify(results, null, 2) },
        { role: 'assistant', content: previousAnswer },
        { role: 'user', content: previousError },
        { role: 'user', content: prompt },
      ].filter((m) => m.content) as any[],
      model: 'gpt-4o',
      stream: true,
    })

    let response = ''
    let progress = 0
    try {
      for await (const part of stream) {
        const chunk = part.choices[0]?.delta?.content
        progress += 1
        response += chunk || ''
        job.updateProgress(Math.min(100, (100 * progress) / 400))
      }
    } catch (error) {
      job.log('Error: ' + error)
    }

    job.log('Response: ' + response)

    const json =
      response
        .match(/```json(.|\n)*```/)?.[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    try {
      const parsedJson = json ? JSON.parse(json) : {} // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry
      return JSON.stringify(parsedJson, null, 2)
    } catch (error) {
      job.updateData({
        ...job.data,
        previousAnswer: response,
        previousError: error.message,
      })
    }
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
