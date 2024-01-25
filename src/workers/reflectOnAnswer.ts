import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import previousPrompt from '../prompts/parsePDF'
import prompt from '../prompts/reflect'
import { discordReview } from '../queues'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

class JobData extends Job {
  data: {
    url: string
    paragraphs: string[]
    answer: string
  }
}

const worker = new Worker(
  'reflectOnAnswer',
  async (job: JobData) => {
    const pdfParagraphs = job.data.paragraphs
    const answer = job.data.answer
    job.log(`Reflecting on: ${answer}
    )}
    ${prompt}`)

    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: pdfParagraphs.join('\n\n') },
        {
          role: 'user',
          content: 'From URL: ' + job.data.url,
        },
        { role: 'user', content: previousPrompt },
        { role: 'system', content: job.data.answer },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4-1106-preview',
      stream: true,
    })
    let response = ''
    let progress = 0
    for await (const part of stream) {
      progress += 1
      response += part.choices[0]?.delta?.content || ''
      job.updateProgress(Math.min(100, (100 * progress) / 400))
    }

    job.log(response)

    discordReview.add('discord review ' + response.slice(0, 20), {
      json: response.split('```')[1],
      url: job.data.url,
    })

    // Do something with job
    return response
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
