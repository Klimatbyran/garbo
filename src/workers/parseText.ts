import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import prompt from '../prompts/parsePDF'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

class JobData extends Job {
  data: {
    text: string
  }
}

const worker = new Worker(
  'parseText',
  async (job: JobData) => {
    job.log(`Parsing text: ${job.data.text}`)
    const pdfText = job.data.text

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: pdfText },
      ],
      model: 'gpt-4',
    })
    // Optionally report some progress

    // Do something with job
    return chatCompletion.choices[0].message.content
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
