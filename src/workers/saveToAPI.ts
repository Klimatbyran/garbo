import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import discord from '../discord'
import { apiFetch } from '../lib/api'

const ONE_DAY = 1000 * 60 * 60 * 24

export interface SaveToApiJob extends DiscordJob {
  data: DiscordJob['data'] & {
    approved?: boolean
    requiresApproval: boolean
    diff: string
    body: any
    wikidata: { node: string }
    apiSubEndpoint: string
  }
}

export const saveToAPI = new DiscordWorker<SaveToApiJob>(
  'saveToAPI',
  async (job: SaveToApiJob) => {
    try {
      const {
        wikidata,
        approved,
        requiresApproval = true,
        diff = '',
        body,
        apiSubEndpoint,
      } = job.data
      const wikidataId = wikidata.node

      // If approval is not required or already approved, proceed with saving

      if (approved) {
        job.editMessage({
          content: `Thanks for approving ${apiSubEndpoint}`,
          components: [],
        })
      }

      if (!requiresApproval || approved) {
        console.log(`Saving approved data for ${wikidataId} to API`)
        await apiFetch(`/companies/${wikidataId}/${apiSubEndpoint}`, { body })
        return { success: true }
      }

      // If approval is required and not yet approved, send approval request
      const buttonRow = discord.createButtonRow(job.id!)

      await job.sendMessage({
        content: `## ${apiSubEndpoint}\n\nNew changes need approval for ${wikidataId}\n\n${diff}`,
        components: [buttonRow],
      })

      return await job.moveToDelayed(Date.now() + ONE_DAY)
    } catch (error) {
      console.error('API Save error:', error)
      throw error
    }
  }
)

export default saveToAPI
