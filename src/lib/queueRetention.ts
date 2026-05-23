import type { QueueOptions } from 'bullmq'

export const COMPLETED_JOB_RETENTION_SECONDS = 24 * 60 * 60
export const FAILED_JOB_RETENTION_SECONDS = 7 * 24 * 60 * 60

export const defaultQueueJobOptions: QueueOptions['defaultJobOptions'] = {
  removeOnComplete: {
    age: COMPLETED_JOB_RETENTION_SECONDS,
    count: 1000,
  },
  removeOnFail: {
    age: FAILED_JOB_RETENTION_SECONDS,
    count: 3000,
  },
}
