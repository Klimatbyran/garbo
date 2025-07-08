import { Worker, WorkerOptions, Job, Queue } from 'bullmq'
import {
  BaseMessageOptions,
  Message,
  OmitPartialGroupDMChannel,
  TextChannel,
} from 'discord.js'
import redis from '../config/redis'
import discord from '../discord'
import apiConfig from '../config/api';
import { ChangeDescription } from './DiffWorker';

interface Approval {
  summary?: string;
  approved: boolean;
  data: ChangeDescription;
  type: string;
  metadata: {
    source: string;
    comment: string;
  };
};

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
    msg: string | BaseMessageOptions
  ) => Promise<Message<true> | undefined>
  editMessage: (
    msg: string | BaseMessageOptions
  ) => Promise<
    OmitPartialGroupDMChannel<Message<true>> | Message<true> | undefined
  >
  requestApproval: (type: string, data: Approval['data'], approved: boolean, metadata: Approval['metadata'], summary?: string) => Promise<void>
  isDataApproved: () => boolean
  hasApproval: () => boolean
  getApprovedBody: () => any
  setThreadName: (name: string) => Promise<TextChannel | undefined>
  sendTyping: () => Promise<void>
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

  job.sendMessage = async (msg: string) => {
    message = job.data.threadId ? await discord.sendMessage(job.data.threadId, msg) : null
    if (!message) return undefined // TODO: throw error?
    await job.updateData({ ...job.data, messageId: message.id })
    return message
  }

  job.sendTyping = async () => {
    if (job.data.threadId) return discord.sendTyping(job.data.threadId)
  }

  job.requestApproval = async (type: string, data: ChangeDescription, approved: boolean = false, metadata: Approval['metadata'], summary?: string) => {
    await job.updateData({ ...job.data, approval: { summary, type, data, approved, metadata }});    
  }

  job.isDataApproved = () => {
    return job.data.approval?.approved ?? false
  }

  job.hasApproval = () => {
    return !!job.data.approval;
  }

  job.getApprovedBody = () => {
    return {
      ...job.data.approval?.data.newValue,
      metadata: job.data.approval?.metadata,
    }
  }

  job.editMessage = async (msg: string | BaseMessageOptions) => {
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
            .filter(Boolean)  // removes falsy values (undefined, null, empty strings)
            .join('\n\n');
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
    const thread = (job.data.threadId ? await discord.client.channels.fetch(
      job.data.threadId
    ) : null) as TextChannel
    return thread?.setName(name)
  }

  return job
}

export class DiscordWorker<T extends DiscordJob> extends Worker {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T) => any,
    options?: WorkerOptions
  ) {
    super(name, (job: T) => callback(addCustomMethods(job) as T), {
      connection: redis,
      concurrency: 3,
      ...options,
    })

    this.queue = new Queue(name, { connection: redis })
  }
}
