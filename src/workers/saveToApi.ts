import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import discord from '../discord'

export interface SaveToApiJob extends DiscordJob {
  data: DiscordJob['data']
  body?: {
    wikidataId: string
    approved?: boolean
    requiresApproval?: boolean
    diff?: string
  }
}

export const saveToAPI = new DiscordWorker<SaveToApiJob>(
  'api-save',
  async (job: SaveToApiJob) => {
    try {
      const { wikidataId, approved, requiresApproval = true } = job.body || {}

      // If approval is not required or already approved, proceed with saving
      if (!requiresApproval || approved) {
        // TODO: Implement actual API save logic here
        console.log(`Saving approved data for ${wikidataId} to API`)
        return { success: true }
      }

      // If approval is required and not yet approved, send approval request
      const buttonRow = discord.createButtonRow(job.id!)
      await job.sendMessage({
        content: `New changes need approval for ${wikidataId}\n\n${
          job.body?.diff || ''
        }`,
        components: [buttonRow],
      })

      return { awaitingApproval: true }
    } catch (error) {
      console.error('API Save error:', error)
      throw error
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  }
)

export default saveToAPI
