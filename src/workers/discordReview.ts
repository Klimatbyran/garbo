import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'
import { summaryTable, scope3Table } from '../lib/discordTable'
import { saveToDb } from '../queues'
import { randomUUID } from 'crypto'

class JobData extends Job {
  declare data: {
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

    job.log(
      `Sending report (pdfHash: ${pdfHash}) for review in Discord:\n${json}`
    )

    job.updateProgress(10)
    const parsedJson = { ...JSON.parse(json), url }
    const documentId = randomUUID()
    job.log(`Saving report to database with uuid: ${documentId}`)
    await saveToDb.add(
      'saveToDb',
      {
        documentId,
        pdfHash,
        threadId,
        report: JSON.stringify(parsedJson, null, 2),
      },
      { attempts: 10 }
    )

    await job.updateData({
      ...job.data,
      documentId,
      json: JSON.stringify(parsedJson),
    })
    job.log(`Job data updated with documentId: ${job.data} and json.`)
    const buttonRow = discord.createButtonRow(job.id)

    const summary = await summaryTable(parsedJson)
    const scope3 = await scope3Table(parsedJson)

    job.log(`Sending message to Discord channel ${threadId}`)
    // send an empty message to the channel
    let message = null
    try {
      message = await discord.sendMessageToChannel(threadId, {
        content: `# ${parsedJson.companyName} (*${
          parsedJson.industryGics?.subIndustry?.name ||
          parsedJson.industryGics?.name
        }*)
${url}
\`${summary}\`
## Scope 3:
\`${scope3}\`
        
        `,
        components: [buttonRow],
      })
    } catch (error) {
      job.log(`Error sending message to Discord channel: ${error.message}`)
      message?.edit(
        `Error sending message to Discord channel: ${error.message}`
      )
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

    if (parsedJson.wikidataId)
      discord.sendMessage(job.data, `Wikidata ID: ${parsedJson.wikidataId}`)
    /*
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
*/

    job.updateProgress(100)
    return documentId
  },
  {
    connection: redis,
  }
)

export default worker
