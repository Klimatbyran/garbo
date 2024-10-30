import { Queue } from 'bullmq'

export function initializeQueues(workerNames: string[], redisUrl: string) {
  return workerNames.map(
    (name) => new Queue(name, { connection: { host: redisUrl } })
  )
}
