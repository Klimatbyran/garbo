import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import previousPrompt from '../prompts/parsePDF'
import prompt from '../prompts/reflect'
import { format } from '../queues'
import discord from '../discord'
import { TextChannel } from 'discord.js'
import { askStream } from '../openai'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

class JobData extends Job {
  declare data: {
    url: string
    paragraphs: string[]
    answer: string
    threadId: string
    pdfHash: string
    previousAnswer: string
    previousError: string
  }
}

const worker = new Worker(
  'reflectOnAnswer',
  async (job: JobData) => {
    const { previousAnswer, answer, previousError } = job.data
    job.clearLogs()

    const message = await discord.sendMessage(
      job.data,
      `🤖 Reflekterar... ${job.attemptsStarted || ''}`
    )

    const childrenValues = Object.values(await job.getChildrenValues()).map(
      (j) => JSON.parse(j)
    )

    job.log(`Reflecting on: 
${answer}
--- Context:
childrenValues: ${JSON.stringify(childrenValues, null, 2)}
--- Prompt:
${prompt}`)

    const response = await askStream(
      [
        {
          role: 'system',
          content:
            'You are an expert in CSRD reporting. Be accurate and follow the instructions carefully.',
        },
        { role: 'user', content: previousPrompt },
        { role: 'assistant', content: answer },
        {
          role: 'user',
          content:
            'Thanks. I have asked another expert to verify each datapoint from different sources. Here are the results:',
        },
        {
          role: 'user',
          content: (childrenValues && JSON.stringify(childrenValues)) || null,
        },
        { role: 'user', content: prompt },
        { role: 'assistant', content: previousAnswer }, // these are used on retry
        { role: 'user', content: previousError }, // these are used on retry and will be filtered out if there are no previous error
      ].filter((m) => m.content) as any[],
      () => {
        discord.sendTyping(job.data)
      }
    )

    let parsedJson
    try {
      job.log('Parsing JSON: \n\n' + response)
      const jsonMatch = response.match(/```json([\s\S]*?)```/)
      const json = jsonMatch ? jsonMatch[1].trim() : response
      parsedJson = JSON.parse(json)
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

    const thread = (await discord.client.channels.fetch(
      job.data.threadId
    )) as TextChannel
    thread.setName(companyName)

    message.edit(`✅ ${companyName} klar`)
    format.add(
      companyName,
      {
        threadId: job.data.threadId,
        url: job.data.url,
        json: JSON.stringify(parsedJson, null, 2),
      },
      {
        attempts: 3,
      }
    )

    return JSON.stringify(parsedJson, null, 2)
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
