import { Job, Worker } from 'bullmq'
import { DiscordJob } from '../lib/DiscordWorker'

export interface ApiSaveJob extends Job {
  data: {
    wikidataId: string
    approved: boolean
    url?: string
    threadId?: string
    channelId?: string
    messageId?: string
  }
}

export const apiSaveWorker = new Worker(
  'api-save',
  async (job: ApiSaveJob) => {
    try {
      const { wikidataId, approved } = job.data
      if (!approved) {
        throw new Error('Cannot save unapproved data')
      }

      // TODO: Implement actual API save logic here
      console.log(`Saving approved data for ${wikidataId} to API`)
      
      return { success: true }
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

export default apiSaveWorker
