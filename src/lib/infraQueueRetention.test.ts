import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import {
  PIPELINE_AUTO_RUN_KEEP_COMPLETED,
  trimInfraQueueRetention,
  trimQueueJobSet,
} from './infraQueueRetention'

const REDIS_URL = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null as null,
  protocol: 2 as const,
}

describe('infraQueueRetention', () => {
  let connection: IORedis
  let queue: Queue
  let worker: Worker

  beforeAll(() => {
    connection = new IORedis(REDIS_URL)
  })

  afterAll(async () => {
    await connection.quit()
  })

  beforeEach(async () => {
    const name = `test-infra-retention-${Date.now()}`
    queue = new Queue(name, {
      connection,
      defaultJobOptions: { removeOnComplete: false },
    })
    worker = new Worker(name, async () => ({ ok: true }), {
      connection,
      concurrency: 1,
    })
  })

  afterEach(async () => {
    await worker.close()
    await queue.obliterate({ force: true })
    await queue.close()
  })

  it('trimQueueJobSet keeps only the newest N completed jobs', async () => {
    for (let i = 0; i < 12; i++) {
      await queue.add('tick', { i })
    }
    await new Promise((r) => setTimeout(r, 1500))
    expect(await queue.getCompletedCount()).toBe(12)

    const removed = await trimQueueJobSet(queue, 'completed', 5)
    expect(removed).toBe(7)
    expect(await queue.getCompletedCount()).toBe(5)
  }, 15_000)

  it('trimInfraQueueRetention caps completed and failed', async () => {
    for (let i = 0; i < 8; i++) {
      await queue.add('tick', { i })
    }
    await new Promise((r) => setTimeout(r, 1200))

    const result = await trimInfraQueueRetention(queue, {
      keepCompleted: 3,
      keepFailed: PIPELINE_AUTO_RUN_KEEP_COMPLETED,
    })
    expect(result.completedRemoved).toBe(5)
    expect(await queue.getCompletedCount()).toBe(3)
  }, 15_000)
})
