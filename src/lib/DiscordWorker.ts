import { Worker, WorkerOptions, Job, Processor, Queue } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'

// NOTE: Maybe this interface could be a class extending the base Job class.
// Then we would get better type completion
export type DiscordWorkerJobData = {
  threadId?: string
  previousAnswer?: string
  messageId?: string
}

class DiscordJob<DataType = DiscordWorkerJobData> extends Job<DataType> {
  constructor(queue: Queue<DataType>, data: DataType, opts: any) {
    super(queue, data, opts)
  }
  async sendMessage(message: string) {
    try {
      const { id } = await discord.sendMessage(
        { threadId: this.data.threadId },
        message
      )
      this.updateData({ messageId: id })
    } catch (err) {
      console.error(`Error sending message: ${err.message}`)
    }
  }

  async editMessage(editedMessage: string) {
    try {
      await discord.editMessage(this.data, editedMessage)
    } catch (err) {
      console.error(`Error editing message: ${err.message}`)
    }
  }
}

export class DiscordWorker<
  DataType = unknown,
  ResultType = unknown,
  NameType extends string = string
> extends Worker<DiscordJob> {
  constructor(
    name: string,
    processor: Processor<DataType, ResultType, NameType>,
    options?: WorkerOptions
  ) {
    super(
      name,
      async (job) => {
        const discordJob = new DiscordJob(job.queue, job.data, job.opts)
        await processor(discordJob)
      },
      {
        concurrency: 10, // default concurrency
        connection: redis,
        ...options,
      }
    )
  }
}
