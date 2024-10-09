import { Worker, WorkerOptions, Job } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'

// NOTE: Maybe this interface could be a class extending the base Job class.
// Then we would get better type completion
export type DiscordWorkerJobData = {
  threadId: string
  previousAnswer?: string
  messageId: string
}

export class DiscordWorker<JobData> extends Worker {
  constructor(
    name: string,
    processor: (job) => Promise<void>,
    options?: WorkerOptions
  ) {
    super(
      name,
      async (job) => {
        const { threadId } = job.data
        await processor({
          ...job,
          sendMessage: async (message: string) => {
            try {
              const messageId = (
                await discord.sendMessage({ threadId }, message)
              ).id
              job.updateData({ messageId })
            } catch (err) {
              job.log(`Error sending message: ${err.message}`)
            }
          },
          editMessage: async (editedMessage: string) => {
            try {
              await discord.editMessage(job.data, editedMessage)
            } catch (err) {
              job.log(`Error editing message: ${err.message}`)
            }
          },
        })
      },
      {
        concurrency: 10, // default concurrency
        connection: redis,
        ...options,
      }
    )
  }
}
