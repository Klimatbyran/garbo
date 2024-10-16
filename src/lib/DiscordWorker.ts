import { Worker, WorkerOptions, Job, Processor, Queue } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'

export class DiscordJob extends Job {
  declare data: {
    // TODO: Update
    url: string
    json: string
    threadId: string
    pdfHash: string
  }
  message: any
  sendMessage: (
    msg: string | { content: string; components: any[] }
  ) => Promise<any>
  editMessage: (msg: string) => Promise<any>
}

export class DiscordWorker extends Worker {
  constructor(
    name: string,
    callback: (job: DiscordJob) => Promise<any>,
    options?: any
  ) {
    super(
      name,
      (job: DiscordJob) => {
        job.sendMessage = (msg) => {
          return (job.message = discord.sendMessage(job.data, msg))
        }
        job.editMessage = (msg) => job.message?.edit(msg)
        return callback(job)
      },
      {
        connection: redis,
        ...options,
      }
    )
  }
}
