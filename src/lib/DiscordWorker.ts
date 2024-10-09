import { Worker, WorkerOptions } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'

export interface DiscordWorkerJobData {
  data: {
    threadId: string
    previousAnswer?: string
  }
}

export class DiscordWorker<T extends DiscordWorkerJobData> extends Worker {
  constructor(name: string, processor: (job: T) => Promise<void>, options?: WorkerOptions) {
    super(name, async (job) => {
      const { threadId } = job.data;
      await processor({
        ...job,
        sendMessage: async (message: string) => {
          await discord.sendMessage({ threadId }, message);
        },
        editMessage: async (messageId: string, editedMessage: string) => {
          await discord.editMessage({ threadId, messageId }, editedMessage);
        },
      });
    }, {
      concurrency: 10, // default concurrency
      connection: redis,
      ...options,
    });
  }
}
