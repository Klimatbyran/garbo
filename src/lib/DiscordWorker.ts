import { Worker, WorkerOptions, Job as BaseJob } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'

// NOTE: Maybe this interface could be a class extending the base Job class.
// Then we would get better type completion
export type DiscordWorkerJobData = {
  threadId: string
  previousAnswer?: string
  messageId: string
}

class DiscordJob extends BaseJob {
  async sendMessage(message: string) {
    try {
      const messageId = (await discord.sendMessage({ threadId: this.data.threadId }, message)).id;
      this.updateData({ messageId });
    } catch (err) {
      console.error(`Error sending message: ${err.message}`);
    }
  }

  async editMessage(editedMessage: string) {
    try {
      await discord.editMessage(this.data, editedMessage);
    } catch (err) {
      console.error(`Error editing message: ${err.message}`);
    }
  }
}

export class DiscordWorker<JobData> extends Worker<DiscordJob> {
  constructor(
    name: string,
    processor: (job) => Promise<void>,
    options?: WorkerOptions
  ) {
    super(
      name,
      async (job) => {
        const { threadId } = job.data
        const discordJob = new DiscordJob(job.queue, job.data, job.opts);
        await processor(discordJob);
      },
      {
        concurrency: 10, // default concurrency
        connection: redis,
        ...options,
      }
    )
  }
}
