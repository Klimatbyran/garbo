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
    previousError: string
  }
}

const worker = new Worker(
  'reflectOnAnswer',
  async (job: JobData) => {
    const { paragraphs: pdfParagraphs, answer, previousError } = job.data

    const message = await discord.sendMessage(
      job.data,
      `🤖 Reflekterar... ${job.attemptsStarted || ''}`
    )

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
        previousError
          ? { role: 'user', content: previousError }
          : { role: 'user', content: '' },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4-turbo',
      stream: true,
    })
    let response = ''
    let reply = ''
    let progress = 0
    for await (const part of stream) {
      const chunk = part.choices[0]?.delta?.content || ''
      progress += 1
      response += chunk
      reply += chunk
      job.updateProgress(Math.min(100, (100 * progress) / 400))
      if (reply.includes('\n') && !response.includes('```json')) {
        discord.sendMessage(job.data, reply)
        reply = ''
      }
    }

    const json =
      response
        .match(/```json(.|\n)*```/)[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    // const lastInstruction = response.split(json).at(-1)
    // if (reply.length) discord.sendMessage(job.data, lastInstruction)
    // //if (instruction.length) message.edit(instruction)

    let parsedJson
    try {
      parsedJson = JSON.parse(json) // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry
    } catch (error) {
      job.updateData({
        ...job.data,
        answer: json,
        previousError: error.message,
      })
      discord.sendMessage(job.data, `❌ ${error.message}:`)
      throw error
    }
    const companyName = parsedJson.companyName

    const thread = (await discord.client.channels.fetch(
      job.data.threadId
    )) as TextChannel
    thread.setName(companyName)

    message.edit(`✅ ${companyName} klar`)
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
