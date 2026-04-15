import { Queue, QueueOptions } from 'bullmq'
import redis from '../config/redis'

export type PipelineJobData = {
  url: string
  threadId?: string
  channelId?: string
  messageId?: string
  autoApprove?: boolean
  [key: string]: unknown
}

export class PipelineQueue {
  queue: Queue

  constructor(name: string, options?: QueueOptions) {
    this.queue = new Queue(name, {
      connection: redis,
      ...options,
    })
  }

  async add(name: string, data: PipelineJobData, options?: unknown) {
    return this.queue.add(name, data, options)
  }

  async close() {
    return this.queue.close()
  }
}
