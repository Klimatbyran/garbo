import { DiscordJob } from './DiscordWorker'

export const createDiscordLogger = (job?: DiscordJob) => {
  if (!job) {
    return {
      info: (message: string) => console.log(`${message}`),
      error: (message: string) => console.error(`❌ ${message}`),
    }
  }
  return {
    info: async (message: string) => {
      await job.log(message)
      try {
        await job.sendMessage(`${message}`)
      } catch (err) {
        await job.log(`WARN: failed to send Discord message: ${message}`)
      }
    },
    error: async (message: string) => {
      await job.log(`ERROR: ${message}`)
      try {
        await job.editMessage(`❌ ${message}`)
      } catch (err) {
        await job.log(`WARN: failed to edit Discord message: ${message}`)
      }
    },
  }
}
