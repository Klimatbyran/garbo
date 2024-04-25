import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'
import { summaryTable, scope3Table } from '../lib/discordTable'
import { saveToDb } from '../queues'

class JobData extends Job {
  data: {
    url: string
    json: string
    channelId: string
    messageId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'discordReview',
  async (job: JobData) => {
    job.updateProgress(5)
    const { url, pdfHash, json, channelId } = job.data

    job.log(`Sending for review in Discord: ${json}`)

    job.updateProgress(10)
    const parsedJson = { ...JSON.parse(json), url }
    job.log(`Saving to db: ${pdfHash}`)
    const documentId = pdfHash
    await saveToDb.add('saveToDb', {
      documentId,
      report: parsedJson,
    })

    job.updateData({ ...job.data, documentId })
    const buttonRow = discord.createButtonRow(job.id)

    const summary = await summaryTable(parsedJson)
    const scope3 = await scope3Table(parsedJson)

    job.log(`Sending message to Discord channel ${discord.channelId}`)
    // send an empty message to the channel
    let message = null
    try {
      message = await discord.sendMessageToChannel(discord.channelId, {
        content: `# ${parsedJson.companyName} (*${parsedJson.industry}*)
${url}
\`${summary}\`
## Scope 3:
\`${scope3}\`
        ${
          parsedJson.reviewComment
            ? `Kommentar från Garbo: ${parsedJson.reviewComment.slice(0, 200)}`
            : ''
        }
        `,
        components: [buttonRow],
      })
    } catch (error) {
      job.log(`Error sending message to Discord channel: ${error.message}`)
      message.edit(`Error sending message to Discord channel: ${error.message}`)
      throw error
    }

    job.updateProgress(100)
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
