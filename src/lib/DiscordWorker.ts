import { Worker, WorkerOptions } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'

export interface DiscordWorkerJobData {
  data: {
    threadId: string
    previousAnswer?: string
  }
}

export class DiscordWorker<T>DiscordWorkerJobData> extends Worker {
  constructor(name: string, worker, options?: WorkerOptions) {
    super(name, worker, {
      concurrency: 10, // default concurrency
      connection: redis,
      ...options,
    })
    const threadId = worker.data.threadId
    worker.sendToDiscord = async (message: string) => {
      await discord.sendMessage({ threadId }, message)
    }
    worker.editMessage = async (editedMessage: string) => {
      message.edit(editedMessage)
    }
  }
}
