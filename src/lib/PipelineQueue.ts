import { JobsOptions, Queue, QueueOptions } from 'bullmq'
import redis from '../config/redis'

export type PipelineJobData = {
  url: string
  /** Run identifier for report run tracking (set by pipeline-api). */
  threadId?: string
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

  async add(name: string, data: PipelineJobData, options?: JobsOptions) {
    return this.queue.add(name, data, options)
  }

  async close() {
    return this.queue.close()
  }
}
