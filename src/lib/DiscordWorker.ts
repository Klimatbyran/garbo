import { Worker, WorkerOptions, Job, Queue } from 'bullmq'
import { Message, TextChannel } from 'discord.js'
import redis from '../config/redis'
import discord from '../discord'

export class DiscordJob extends Job {
  declare data: {
    url: string
    threadId: string
    channelId: string
    wikidataId?: string
    messageId?: string
  }

  message: any
  sendMessage: (
    msg: string | { files?: any[]; content?: string; components?: any[] }
  ) => Promise<any>
  editMessage: (msg: string) => Promise<any>
  setThreadName: (name: string) => Promise<any>
  sendTyping: () => Promise<any>
  getChildrenEntries: () => Promise<any>
}

function addCustomMethods(job: DiscordJob) {
  let message: Message<true> | null = null
  /**
   * Combine results of children jobs into a single object.
   */
  job.getChildrenEntries = async () => {
    return job
      .getChildrenValues()
      .then((values) => Object.values(values))
      .then((values) =>
        values
          .map((value) => {
            // Only parse the result for children jobs that returned potential JSON
            if (value && typeof value === 'string') {
              // NOTE: This still assumes all children jobs return JSON, and will crash if we return string results.
              return Object.entries(JSON.parse(value))
            } else {
              return Object.entries(value)
            }
          })
          .flat()
      )
      .then((values) => Object.fromEntries(values))
  }

  job.sendMessage = async (msg: any) => {
    message = await discord.sendMessage(job.data, msg)
    if (!message) return undefined // TODO: throw error?
    await job.updateData({ ...job.data, messageId: message.id })
    return message
  }

  job.sendTyping = async () => {
    return discord.sendTyping(job.data)
  }

  job.editMessage = async (msg) => {
    if (!message && job.data.messageId) {
      const { channelId, threadId, messageId } = job.data
      message = await discord.findMessage({
        channelId,
        threadId,
        messageId,
      })
    }
    if (message && message.edit) {
      try {
        return message.edit(msg)
      } catch (err) {
        job.log(
          'error editing Discord message:' +
            err.message +
            '\n' +
            JSON.stringify(message)
        )
        return job.sendMessage(msg)
      }
    } else {
      return job.sendMessage(msg)
    }
  }

  job.setThreadName = async (name) => {
    const thread = (await discord.client.channels.fetch(
      job.data.threadId
    )) as TextChannel
    return thread.setName(name)
  }

  return job
}

export class DiscordWorker<T extends DiscordJob> extends Worker {
  queue: Queue
  constructor(
    name: string,
    // Enforce explicit return values to avoid accidentally stalled jobs which stay in "Active" without moving on.
    callback: (job: T) => Promise<string | boolean | number | {}>,
    options?: WorkerOptions
  ) {
    super(name, (job: T) => callback(addCustomMethods(job) as T), {
      connection: redis,
      concurrency: 10,
      ...options,
    })

    this.queue = new Queue(name, { connection: redis })
  }
}
