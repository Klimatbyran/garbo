import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import prompt from '../prompts/format'
import { discordReview } from '../queues'
import discord from '../discord'
import { askStream } from '../openai'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

class JobData extends Job {
  data: {
    url: string
    json: string
    threadId: string
    pdfHash: string
    previousAnswer: string
    previousError: string
  }
}

const worker = new Worker(
  'format',
  async (job: JobData) => {
    const { json: previousJson, previousAnswer, previousError } = job.data

    const message = await discord.sendMessage(
      job.data,
      `🤖 Formaterar... ${job.attemptsStarted || ''}`
    )

    let progress = 0
    const response = await askStream(
      [
        { role: 'system', content: prompt },
        { role: 'user', content: previousJson },
        { role: 'assistant', content: previousAnswer },
        { role: 'user', content: previousError },
      ].filter((m) => m.content) as any[],
      (response) => {
        message?.edit(response)
        job.updateProgress(Math.min(100, (100 * progress++) / 10))
      }
    )

    const json =
      response
        .match(/```json(.|\n)*```/)[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    let parsedJson
    try {
      parsedJson = JSON.parse(json) // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry
    } catch (error) {
      job.updateData({
        ...job.data,
        previousAnswer: response,
        previousError: error.message,
      })
      discord.sendMessage(job.data, `❌ ${error.message}:`)
      throw error
    }
    const companyName = parsedJson.companyName

    discordReview.add(companyName, {
      ...job.data,
      json: JSON.stringify(parsedJson, null, 2),
    })

    return JSON.stringify(parsedJson, null, 2)
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
