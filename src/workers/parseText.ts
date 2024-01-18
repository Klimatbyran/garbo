import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import prompt from '../prompts/parsePDF'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

class JobData extends Job {
  data: {
    paragraphs: string[]
  }
}

const worker = new Worker(
  'parseText',
  async (job: JobData) => {
    const pdfParagraphs = job.data.paragraphs.filter((p) =>
      p.toLocaleLowerCase().includes('scope')
    ) // naive approach to find the paragraph with the co2 data - replace with vector search
    job.log(`Parsing text from ${pdfParagraphs.length} paragraphs`)

    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: pdfParagraphs.join('\n\n') },
      ],
      model: 'gpt-4-1106-preview',
      stream: true,
    })
    let response = ''
    let progress = 0
    for await (const part of stream) {
      response += part.choices[0]?.delta?.content || ''
      job.updateProgress(Math.min(1, progress / 400))
    }

    job.log(response)

    // Do something with job
    return response
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
