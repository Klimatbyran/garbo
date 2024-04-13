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
    // Is this a problem to do every time?
    job.updateProgress(5)

    job.log(`Sending for review in Discord: ${job.data.json}`)

    job.updateProgress(10)
    const parsedJson = JSON.parse(job.data.json)
    parsedJson.url = job.data.url
    job.log(`Saving to db: ${job.data.pdfHash}`)
    const documentId = await saveToDb(job.data.pdfHash, parsedJson)
    const buttonRow = createButtonRow(documentId)

    const summary = await summaryTable(parsedJson)
    const scope3 = await scope3Table(parsedJson)

    job.log(`Sending message to Discord channel ${discord.channelId}`)
    let message = null
    try {
      message = await discord.sendMessageToChannel(discord.channelId, {
        content: `# ${parsedJson.companyName} (*${parsedJson.industry}*)
${job.data.url}
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

    discord.once('edit', async (documentId, feedback) => {
      job.log(
        'received feedback: ' + feedback + ' for documentId: ' + documentId
      )
      if (documentId === documentId) {
        job.log(`Got feedback: ${feedback}`)
        const thread = await message.startThread({
          name: 'Feedback',
          autoArchiveDuration: 60,
          reason: 'Feedback thread for review',
        })
        await thread.send({
          content: `Feedback: ${feedback}`,
          components: [],
        })
        await userFeedback.add('userFeedback', {
          ...job.data,
          documentId,
          json: JSON.stringify(parsedJson, null, 2),
          threadId: thread.id,
          feedback,
        })
      }
    })

    job.updateProgress(40)
    job.updateProgress(100)
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
