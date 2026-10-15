import { JobsOptions, Queue, QueueOptions } from 'bullmq'
import { getSharedQueue } from './getSharedQueue'

export type PipelineJobData = {
  url: string
  /** Run identifier for report run tracking (set by pipeline-api). */
  threadId?: string
  autoApprove?: boolean
  [key: string]: unknown
}

export class PipelineQueue {
  queue: Queue

  constructor(name: string, _options?: QueueOptions) {
    this.queue = getSharedQueue(name)
  }

  async add(name: string, data: PipelineJobData, options?: JobsOptions) {
    return this.queue.add(name, data, options)
  }

  async close() {
    // Process-wide shared client; closing it would disconnect every user of this name.
  }
}
