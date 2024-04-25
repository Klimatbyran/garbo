import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import previousPrompt from '../prompts/reflect'
import discord from '../discord'
import elastic from '../elastic'
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
    documentId: string
    url: string
    json: string
    threadId: string
    feedback: string
  }
}

const worker = new Worker(
  'userFeedback',
  async (job: JobData) => {
    const { feedback, url, json: previousJson } = job.data

    const client = new ChromaClient(chromadb)
    const collection = await client.getCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })

    const results = await collection.query({
      nResults: 5,
      where: {
        // TODO: add markdown here?
        source: url,
      },
      queryTexts: [
        'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, växthusgaser, utsläpp, basår, koldioxidutsläpp, koldioxid, klimatmål',
        feedback,
      ],
    })
    console.log('RESULTS', results)
    const pdfParagraphs = results.documents.flat()

    console.log('PDF_PARAGRAPHS', pdfParagraphs)
    job.log(`Reflecting on: ${feedback}
    ${previousJson}`)

    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: pdfParagraphs.join('\n\n') },
        { role: 'user', content: 'Previous prompt: ' + previousPrompt },
        { role: 'system', content: previousJson },
        { role: 'user', content: feedback },
        {
          role: 'user',
          content: `Please reply with new JSON. Add a new field called agentResponse with your reflections if needed.
            No matter what the input is, you must always return the same JSON structure as the previous prompt specifies.`,
        },
      ],
      model: 'gpt-4-1106-preview',
      stream: true,
    })

    /*console.log("Getting channeld with CHANNEL_ID", channelId)
    const channel = (await discord.client.channels.fetch(
      channelId
    )) as TextChannel
    const message = await channel?.messages?.fetch(messageId)*/

    discord.sendMessage(job.data, `Feedback: ${feedback}`)

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
      discord.sendMessage(job.data, `Error: ${error}`)
    }

    job.log('Response: ' + response)

    const json =
      response
        .match(/```json(.|\n)*```/)[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    const parsedJson = JSON.parse(json) // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry

    job.log('Parsed JSON: ' + JSON.stringify(parsedJson, null, 2))
    const summary = await summaryTable(parsedJson)
    const scope3 = await scope3Table(parsedJson)

    await discord.sendMessageToChannel(job.data.threadId, {
      content: `# ${parsedJson.companyName} (*${parsedJson.industry}*)
        \`${summary}\`
        ## Scope 3:
        \`${scope3}\`
        `,
      components: [], // todo: add approve buttons
    })

    if (parsedJson.reviewComment)
      await discord.sendMessage(job.data, parsedJson.reviewComment)

    job.log('Sent to thread' + job.data.threadId)

    return json
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
