import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'
import { summaryTable, scope3Table } from '../lib/discordTable'
import { saveToDb } from '../queues'
import { parse } from 'dotenv'
import { v4 as uuidv4 } from 'uuid';

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

    job.log(`Sending report (pdfHash: ${pdfHash}) for review in Discord:\n${json}`)

    job.updateProgress(10)
    const parsedJson = { ...JSON.parse(json), url }
    const documentId = uuidv4()
    job.log(`Saving report to database with uuid: ${documentId}`)
    await saveToDb.add('saveToDb', {
      documentId,
      pdfHash,
      threadId,
      report: JSON.stringify(parsedJson, null, 2),
    })

    job.updateData({ ...job.data, documentId })
    job.log(`Job data updated with documentId: ${job.data}`)
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

    if (parsedJson.goals)
      discord.sendMessage(
        job.data,
        `Mål: 
${parsedJson.goals.map((g) => ` - ${g.year}: ${g.description}`).join('\n')}`
      )

    if (parsedJson.initiatives)
      discord.sendMessage(
        job.data,
        `Initiativ: 
${parsedJson.initiatives
  .map((i) => ` - ${i.year}: ${i.description}`)
  .join('\n')}`
      )

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

    if (parsedJson.confidenceScore)
      discord.sendMessage(
        job.data,
        `Confidence score: ${parsedJson.confidenceScore}`
      )

    if (parsedJson.publicComment)
      discord.sendMessage(
        job.data,
        `Publik kommentar från Garbo: ${parsedJson.publicComment}`
      )

    job.updateProgress(100)
    return documentId
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
