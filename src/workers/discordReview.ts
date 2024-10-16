import discord from '../discord'
import { summaryTable, scope3Table } from '../lib/discordTable'
import { randomUUID } from 'crypto'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    json: string
  }
}

const worker = new DiscordWorker<JobData>(
  'discordReview',
  async (job: JobData) => {
    const { url, json, threadId } = job.data
    const parsedJson = { ...JSON.parse(json), url }
    const documentId = randomUUID()
    job.log(`Saving report to database with uuid: ${documentId}`)

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
    job.sendMessage({
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

    const { reviewComment, agentResponse, wikidataId } = parsedJson
    if (reviewComment) job.sendMessage(`Kommentar från Garbo: ${reviewComment}`)
    if (agentResponse) job.sendMessage(`Svar på feedback: ${agentResponse}`)
    if (wikidataId) job.sendMessage(`Wikidata ID: ${wikidataId}`)

    job.updateProgress(100)
    return documentId
  }
)

export default worker
