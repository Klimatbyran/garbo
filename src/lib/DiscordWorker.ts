import { Worker, WorkerOptions, Job, Queue, UnrecoverableError } from 'bullmq'
import {
  BaseMessageOptions,
  Message,
  OmitPartialGroupDMChannel,
  TextChannel,
} from 'discord.js'
import redis from '../config/redis'
import discord from '../discord'
import apiConfig from '../config/api'
import { ChangeDescription } from './DiffWorker'
import { createDiscordLogger } from './logger'
import { Logger } from '@/types'

interface Approval {
  summary?: string
  approved: boolean
  data: ChangeDescription
  type: string
  metadata: {
    source: string
    comment: string
  }
}

export class DiscordJob extends Job {
  declare data: {
    url: string
    threadId?: string
    channelId: string
    messageId?: string
    autoApprove: boolean
    approval?: Approval
  }

  //message: any
  sendMessage: (
    msg: string | BaseMessageOptions,
  ) => Promise<Message<true> | undefined>
  editMessage: (
    msg: string | BaseMessageOptions,
  ) => Promise<
    OmitPartialGroupDMChannel<Message<true>> | Message<true> | undefined
  >
  requestApproval: (
    type: string,
    data: Approval['data'],
    approved: boolean,
    metadata: Approval['metadata'],
    summary?: string,
  ) => Promise<void>
  isDataApproved: () => boolean
  hasApproval: () => boolean
  getApprovedBody: () => any
  setThreadName: (name: string) => Promise<TextChannel | undefined>
  sendTyping: () => Promise<void>
  getChildrenEntries: () => Promise<any>
  hasValidThreadId: () => boolean
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
        values.map((value) => {
          if (value && typeof value === 'string') {
            return JSON.parse(value)
          } else {
            return value
          }
        }),
      )
      .then((objects) => {
        const out: Record<string, any> = {}
        for (const obj of objects as Record<string, any>[]) {
          if (!obj || typeof obj !== 'object') continue
          const payload =
            Object.prototype.hasOwnProperty.call(obj, 'value') &&
            obj.value &&
            typeof obj.value === 'object'
              ? (obj.value as Record<string, any>)
              : obj
          Object.assign(out, payload)
        }
        return out
      })
  }

  job.hasValidThreadId = function () {
    return (
      typeof this.data.threadId === 'string' &&
      /^\d{17,19}$/.test(this.data.threadId)
    )
  }

  job.sendMessage = async (msg: string) => {
    if (!job.hasValidThreadId()) {
      console.log(
        'Invalid Discord threadId format in sendMessage:',
        job.data.threadId,
      )
      return undefined
    }
    const threadId = job.data.threadId as string
    message = await discord.sendMessage(threadId, msg)
    if (!message) return undefined // TODO: throw error?
    await job.updateData({ ...job.data, messageId: message.id })
    return message
  }

  job.sendTyping = async () => {
    if (!job.hasValidThreadId()) {
      console.log(
        'Invalid Discord threadId format in sendTyping:',
        job.data.threadId,
      )
      return
    }
    const threadId = job.data.threadId as string
    return discord.sendTyping(threadId)
  }

  job.requestApproval = async (
    type: string,
    data: ChangeDescription,
    approved: boolean = false,
    metadata: Approval['metadata'],
    summary?: string,
  ) => {
    await job.updateData({
      ...job.data,
      approval: { summary, type, data, approved, metadata },
    })
  }

  job.isDataApproved = () => {
    return job.data.approval?.approved ?? false
  }

  job.hasApproval = () => {
    return !!job.data.approval
  }

  job.getApprovedBody = () => {
    return {
      ...job.data.approval?.data.newValue,
      metadata: job.data.approval?.metadata,
    }
  }

  job.editMessage = async (msg: string | BaseMessageOptions) => {
    if (!job.hasValidThreadId()) {
      console.log('Invalid Discord threadId format:', job.data.threadId)
      return undefined
    }

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
        if (typeof msg === 'string') {
          msg = {
            content: msg,
          }
        }
        msg.content = [message.content, msg.content]
          .filter(Boolean) // removes falsy values (undefined, null, empty strings)
          .join('\n\n')
        return message.edit(msg)
      } catch (err) {
        job.log(
          'error editing Discord message:' +
            err.message +
            '\n' +
            JSON.stringify(message),
        )
        return job.sendMessage(msg)
      }
    } else {
      return job.sendMessage(msg)
    }
  }

  job.setThreadName = async (
    name: string,
  ): Promise<TextChannel | undefined> => {
    const threadId = job.data.threadId as string
    const thread = (await discord.client.channels.fetch(
      threadId,
    )) as TextChannel
    return thread?.setName(name)
  }

  return job
}

export class DiscordWorker<T extends DiscordJob> extends Worker {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T, logger: Logger) => any,
    options?: WorkerOptions,
  ) {
    super(
      name,
      async (raw: T) => {
        const job = addCustomMethods(raw) as T
        const logger = createDiscordLogger(job)
        return callback(job, logger)
      },
      {
        connection: redis,
        concurrency: 3,
        ...options,
      },
    )

    this.queue = new Queue(name, { connection: redis })
  }
}
