import { DefaultJobOptions, Queue } from 'bullmq'
import redis from '../config/redis'
import { DEFAULT_PIPELINE_JOB_OPTIONS } from './pipelineJobOptions'

const queuesByName = new Map<string, Queue>()
const queueOptionsByName = new Map<string, DefaultJobOptions>()

export function getSharedQueue(
  name: string,
  defaultJobOptions: DefaultJobOptions = DEFAULT_PIPELINE_JOB_OPTIONS
): Queue {
  const existingQueue = queuesByName.get(name)
  if (existingQueue) {
    const previous = queueOptionsByName.get(name)
    if (
      previous &&
      JSON.stringify(previous) !== JSON.stringify(defaultJobOptions)
    ) {
      console.warn(
        `[getSharedQueue] queue "${name}" already created with different defaultJobOptions; keeping the first (removeOnComplete=${JSON.stringify(previous.removeOnComplete)})`
      )
    }
    return existingQueue
  }

  const queue = new Queue(name, {
    connection: redis,
    defaultJobOptions,
  })
  queuesByName.set(name, queue)
  queueOptionsByName.set(name, defaultJobOptions)
  return queue
}
