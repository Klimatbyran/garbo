import { Job, Worker } from 'bullmq'
import { DiscordJob } from '../lib/DiscordWorker'
import discord from '../discord'

export interface SaveToApiJob extends Job {
  data: {
    wikidataId: string
    approved?: boolean
    url?: string
    threadId?: string
    channelId?: string
    messageId?: string
    requiresApproval?: boolean
  }
}

export const saveToAPI = new Worker(
  'api-save',
  async (job: SaveToApiJob) => {
    try {
      const { wikidataId, approved, requiresApproval = true, messageId, channelId } = job.data

      // If approval is not required or already approved, proceed with saving
      if (!requiresApproval || approved) {
        // TODO: Implement actual API save logic here
        console.log(`Saving approved data for ${wikidataId} to API`)
        return { success: true }
      }

      // If approval is required and not yet approved, send approval request
      if (messageId && channelId) {
        const buttonRow = discord.createButtonRow(job.id)
        await discord.sendMessageToChannel(channelId, {
          content: `New changes need approval for ${wikidataId}`,
          components: [buttonRow]
        })
      }

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
