import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import previousPrompt from '../prompts/parsePDF'
import prompt from '../prompts/reflect'
import { discordReview } from '../queues'
import discord from '../discord'
import { TextChannel } from 'discord.js'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

class JobData extends Job {
  data: {
    url: string
    paragraphs: string[]
    answer: string
    threadId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'reflectOnAnswer',
  async (job: JobData) => {
    const pdfParagraphs = job.data.paragraphs
    const answer = job.data.answer

    discord.sendMessage(job.data, `Reflekterar på svaret...`)

    job.log(`Reflecting on: 
${answer}
--- Prompt:
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

    const json =
      response
        .match(/```json(.|\n)*```/)[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    const parsedJson = JSON.parse(json) // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry

    const companyName = parsedJson.companyName

    await discord.sendMessage(job.data, `Skickar för granskning`)
    discordReview.add(companyName, {
      ...job.data,
      json: JSON.stringify(parsedJson, null, 2),
    })

    // Do something with job
    return response
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
