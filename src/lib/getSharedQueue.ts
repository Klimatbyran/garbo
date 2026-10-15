import { DefaultJobOptions, Queue } from 'bullmq'
import redis from '../config/redis'
import { DEFAULT_PIPELINE_JOB_OPTIONS } from './pipelineJobOptions'

const queuesByName = new Map<string, Queue>()

export function getSharedQueue(
  name: string,
  defaultJobOptions: DefaultJobOptions = DEFAULT_PIPELINE_JOB_OPTIONS
): Queue {
  const existingQueue = queuesByName.get(name)
  if (existingQueue) return existingQueue

  const queue = new Queue(name, {
    connection: redis,
    defaultJobOptions,
  })
  queuesByName.set(name, queue)
  return queue
}
