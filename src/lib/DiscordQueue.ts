import { Queue, QueueOptions } from 'bullmq'
import redis from '../config/redis'

/** Keep completed/failed job data in Redis for 30 days; long-term history is in Postgres (JobRunArchive). */
const REDIS_JOB_RETENTION_AGE_SEC = 30 * 24 * 3600

export type DiscordJobData = {
  url: string
  threadId: string
  channelId?: string
  messageId?: string
  autoApprove?: boolean
  [key: string]: any
}

export class DiscordQueue {
  queue: Queue

  constructor(name: string, options?: QueueOptions) {
    this.queue = new Queue(name, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: { age: REDIS_JOB_RETENTION_AGE_SEC },
        removeOnFail: { age: REDIS_JOB_RETENTION_AGE_SEC },
      },
      ...options,
    })
  }

  async add(name: string, data: DiscordJobData, options?: any) {
    return this.queue.add(name, data, options)
  }

  async close() {
    return this.queue.close()
  }
}
