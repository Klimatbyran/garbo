import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import previousPrompt from '../prompts/reflect'
import discord from '../discord'
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import chromadb from '../config/chromadb'
import { scope3Table, summaryTable } from '../lib/discordTable'
import { TextChannel } from 'discord.js'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})

class JobData extends Job {
  data: {
    url: string
    channelId: string
    messageId: string
    json: string
    feedback: string
  }
}

const worker = new Worker(
  'userFeedback',
  async (job: JobData) => {
    const { feedback, url, json: previousJson, messageId, channelId } = job.data
    const client = new ChromaClient(chromadb)
    const collection = await client.getCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })

    const results = await collection.query({
      nResults: 5,
      where: {
        source: url,
      },
      queryTexts: [
        'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, växthusgaser, utsläpp, basår, koldioxidutsläpp, koldioxid, klimatmål',
        feedback,
      ],
    })

    const pdfParagraphs = results.documents.flat()
    job.log(`Reflecting on: ${feedback}
    messageId: ${messageId}
    )}
    ${previousJson}`)

    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: pdfParagraphs.join('\n\n') },
        { role: 'user', content: previousPrompt },
        { role: 'system', content: previousJson },
        { role: 'user', content: feedback },
        {
          role: 'user',
          content:
            'Please reply with new JSON. Add a new field called agentResponse with your reflections if needed.',
        },
      ],
      model: 'gpt-4-1106-preview',
      stream: true,
    })
    let response = ''
    let progress = 0

    const channel = (await discord.client.channels.fetch(
      channelId
    )) as TextChannel
    const message = await channel?.messages?.fetch(messageId)

    const thread = await message.startThread({
      name: 'Feedback ' + JSON.parse(previousJson).companyName,
      autoArchiveDuration: 60,
      reason: 'Feedback thread for review',
    })
    job.log(`Started thread: ${thread?.id}`)
    await thread.send({
      content: `Feedback: ${feedback}`,
      components: [],
    })

    let reply = ''
    for await (const part of stream) {
      const chunk = part.choices[0]?.delta?.content
      progress += 1
      response += chunk || ''
      job.updateProgress(Math.min(100, (100 * progress) / 400))
      if (chunk?.includes('\n')) {
        thread.send({
          content: reply,
          components: [],
        })
        reply = ''
      } else {
        reply += chunk
      }
    }

    if (reply) thread.send({ content: reply, components: [] })

    const json =
      response
        .match(/```json(.|\n)*```/)[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    const parsedJson = JSON.parse(json) // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry

    if (thread.isThread()) {
      const summary = await summaryTable(parsedJson)
      const scope3 = await scope3Table(parsedJson)

      await thread.send({
        content: `# ${parsedJson.companyName} (*${parsedJson.industry}*)
        \`${summary}\`
        ## Scope 3:
        \`${scope3}\`
        `,
        components: [], // todo: add approve buttons
      })

      if (parsedJson.reviewComment)
        await thread.send({
          content: parsedJson.reviewComment,
          components: [], // todo: add approve buttons
        })

      job.log('Sent to thread' + thread.id)
    }

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
