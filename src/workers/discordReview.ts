import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import elastic from '../elastic'
import discord from '../discord'
import {
  ModalBuilder,
  ButtonBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ModalActionRowComponentBuilder,
  TextInputStyle,
  Embed,
  EmbedBuilder,
} from 'discord.js'
import { summaryTable, scope3Table } from '../lib/discordTable'
import { userFeedback } from '../queues'

class JobData extends Job {
  data: {
    url: string
    json: string
    channelId: string
    messageId: string
    pdfHash: string
  }
}

async function saveToDb(id: string, report: any) {
  return await elastic.indexReport(id, report)
}
const createButtonRow = (documentId) => {
  // TODO: move to discord.ts
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve-${documentId}`)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`edit-${documentId}`)
      .setLabel('Feedback')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`reject-${documentId}`)
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger)
  )
}

const worker = new Worker(
  'discordReview',
  async (job: JobData) => {
    job.updateProgress(5)
    const { url, pdfHash, json, channelId } = job.data

    job.log(`Sending for review in Discord: ${json}`)

    job.updateProgress(10)
    const parsedJson = JSON.parse(json)
    parsedJson.url = url
    job.log(`Saving to db: ${pdfHash}`)
    const documentId = await saveToDb(pdfHash, parsedJson)
    const buttonRow = createButtonRow(documentId)

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

    /*discord.once('edit', async (documentId, feedback) => {
      console.log('edit', documentId, feedback)
      job.log(`Received feedback: ${feedback} for messageId: ${message?.id}`)
      job.log(`Creating feedback job`)
      await userFeedback.add('userFeedback', {
        url,
        documentId,
        messageId: message.id,
        channelId,
        json: JSON.stringify(parsedJson, null, 2),
        feedback,
      })
    })*/

    job.updateProgress(40)
    job.updateProgress(100)
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
