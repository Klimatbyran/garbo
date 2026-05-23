import { Worker, WorkerOptions, Job, Queue } from 'bullmq'
import {
  BaseMessageOptions,
  Message,
  OmitPartialGroupDMChannel,
  TextChannel,
} from 'discord.js'
import redis from '../config/redis'
import discord from '../pipelineBridge'
import { ChangeDescription } from './DiffWorker'
import { createPipelineLogger } from './logger'
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

type ApprovedBody = Record<string, unknown> & {
  metadata?: Approval['metadata']
}

type ChildrenEntries = Record<string, unknown>

export class PipelineJob extends Job {
  declare data: {
    url: string
    discordThreadId?: string
    discordChannelId?: string
    discordMessageId?: string
    autoApprove: boolean
    approval?: Approval
    /** Propagated from pipeline-api job create; used for batch filtering. */
    batchId?: string
  }

  //message: any
  sendMessage: (
    msg: string | BaseMessageOptions
  ) => Promise<Message<true> | undefined>
  log: (row: string) => Promise<number>
  editMessage: (
    msg: string | BaseMessageOptions
  ) => Promise<
    OmitPartialGroupDMChannel<Message<true>> | Message<true> | undefined
  >
  requestApproval: (
    type: string,
    data: Approval['data'],
    approved: boolean,
    metadata: Approval['metadata'],
    summary?: string
  ) => Promise<void>
  isDataApproved: () => boolean
  hasApproval: () => boolean
  getApprovedBody: () => ApprovedBody
  setThreadName: (name: string) => Promise<TextChannel | undefined>
  sendTyping: () => Promise<void>
  getChildrenEntries: () => Promise<ChildrenEntries>
  hasValidDiscordThreadId: () => boolean
}

function addCustomMethods(job: PipelineJob) {
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
        })
      )
      .then((objects) => {
        const out: ChildrenEntries = {}
        for (const obj of objects as Record<string, unknown>[]) {
          if (!obj || typeof obj !== 'object') continue
          const payload =
            Object.prototype.hasOwnProperty.call(obj, 'value') &&
            obj.value &&
            typeof obj.value === 'object'
              ? (obj.value as Record<string, unknown>)
              : obj
          Object.assign(out, payload)
        }
        return out
      })
  }

  job.hasValidDiscordThreadId = function () {
    return (
      typeof this.data.discordThreadId === 'string' &&
      /^\d{17,19}$/.test(this.data.discordThreadId)
    )
  }

  job.sendMessage = async (msg: string | BaseMessageOptions) => {
    if (!job.hasValidDiscordThreadId()) {
      console.log(
        'Invalid Discord threadId format in sendMessage:',
        job.data.discordThreadId
      )
      return undefined
    }
    const discordThreadId = job.data.discordThreadId as string
    message = await discord.sendMessage(discordThreadId, msg)
    if (!message) return undefined // TODO: throw error?
    await job.updateData({ ...job.data, discordMessageId: message.id })
    return message
  }

  job.sendTyping = async () => {
    if (!job.hasValidDiscordThreadId()) {
      console.log(
        'Invalid Discord threadId format in sendTyping:',
        job.data.discordThreadId
      )
      return
    }
    const discordThreadId = job.data.discordThreadId as string
    return discord.sendTyping(discordThreadId)
  }

  job.requestApproval = async (
    type: string,
    data: ChangeDescription,
    approved: boolean = false,
    metadata: Approval['metadata'],
    summary?: string
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
    const approvedValue = job.data.approval?.data.newValue
    const approvedData =
      approvedValue && typeof approvedValue === 'object'
        ? (approvedValue as Record<string, unknown>)
        : {}

    return {
      ...approvedData,
      metadata: job.data.approval?.metadata,
    }
  }

  job.editMessage = async (msg: string | BaseMessageOptions) => {
    if (!job.hasValidDiscordThreadId()) {
      console.log('Invalid Discord threadId format:', job.data.discordThreadId)
      return undefined
    }

    if (!message && job.data.discordMessageId) {
      const { discordChannelId, discordThreadId, discordMessageId } = job.data
      message = await discord.findMessage({
        channelId: discordChannelId,
        threadId: discordThreadId,
        messageId: discordMessageId,
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
            JSON.stringify(message)
        )
        return job.sendMessage(msg)
      }
    } else {
      return job.sendMessage(msg)
    }
  }

  job.setThreadName = async (
    name: string
  ): Promise<TextChannel | undefined> => {
    const discordThreadId = job.data.discordThreadId as string
    const thread = (await discord.client.channels.fetch(
      discordThreadId
    )) as TextChannel
    return thread?.setName(name)
  }

  return job
}

export class PipelineWorker<T extends PipelineJob> extends Worker {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T, logger: Logger) => unknown,
    options?: WorkerOptions
  ) {
    super(
      name,
      async (raw: T) => {
        const job = addCustomMethods(raw) as T
        const logger = createPipelineLogger(job)
        return callback(job, logger)
      },
      {
        connection: redis,
        concurrency: 3,
        ...options,
      }
    )

    this.queue = new Queue(name, { connection: redis })
  }
}
