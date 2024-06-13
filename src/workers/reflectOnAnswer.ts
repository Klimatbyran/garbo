import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import previousPrompt from '../prompts/parsePDF'
import prompt from '../prompts/extractJson'
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
    previousAnswer: string
    previousError: string
  }
}

const worker = new Worker(
  'reflectOnAnswer',
  async (job: JobData) => {
    const { previousAnswer, answer, previousError } = job.data

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

    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert in CSRD reporting.' },
        { role: 'user', content: previousPrompt },
        { role: 'assistant', content: answer },
        {
          role: 'assistant',
          content: (childrenValues && JSON.stringify(childrenValues)) || null,
        },
        { role: 'user', content: prompt },
        { role: 'assistant', content: previousAnswer },
        { role: 'user', content: previousError },
      ].filter((m) => m.content) as any[],
      model: 'gpt-4o',
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
      if (reply.includes('\n')) {
        job.log(reply)
        if (!response.includes('```json')) discord.sendMessage(job.data, reply)
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
    discordReview.add(companyName, {
      ...job.data,
      json: JSON.stringify(parsedJson, null, 2),
    })

    return JSON.stringify(parsedJson, null, 2)
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
