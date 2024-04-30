import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'
import { summaryTable, scope3Table } from '../lib/discordTable'
import { saveToDb } from '../queues'

class JobData extends Job {
  data: {
    url: string
    json: string
    threadId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'discordReview',
  async (job: JobData) => {
    job.updateProgress(5)
    const { url, pdfHash, json, threadId } = job.data

    job.log(`Sending for review in Discord: ${json}`)

    job.updateProgress(10)
    const parsedJson = { ...JSON.parse(json), url }
    job.log(`Saving to db: ${pdfHash}`)
    const documentId = pdfHash
    await saveToDb.add('saveToDb', {
      documentId,
      threadId,
      report: parsedJson,
    })

    job.updateData({ ...job.data, documentId })
    const buttonRow = discord.createButtonRow(job.id)

    const summary = await summaryTable(parsedJson)
    const scope3 = await scope3Table(parsedJson)

    job.log(`Sending message to Discord channel ${threadId}`)
    // send an empty message to the channel
    let message = null
    try {
      message = await discord.sendMessageToChannel(threadId, {
        content: `# ${parsedJson.companyName} (*${parsedJson.industry}*)
${url}
\`${summary}\`
## Scope 3:
\`${scope3}\`
        
        `,
        components: [buttonRow],
      })
    } catch (error) {
      job.log(`Error sending message to Discord channel: ${error.message}`)
      message.edit(`Error sending message to Discord channel: ${error.message}`)
      throw error
    }
    if (parsedJson.reviewComment)
      discord.sendMessage(
        job.data,
        `Kommentar från Garbo: ${parsedJson.reviewComment}`
      )

    if (parsedJson.agentResponse)
      discord.sendMessage(
        job.data,
        `Svar på feedback: ${parsedJson.agentResponse}`
      )

    job.updateProgress(100)
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
