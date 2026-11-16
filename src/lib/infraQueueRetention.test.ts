import { describe, it, expect, jest } from '@jest/globals'
import type { Queue } from 'bullmq'
import { trimInfraQueueRetention, trimQueueJobSet } from './infraQueueRetention'

function fakeJob(id: string) {
  return {
    id,
    remove: jest.fn(async () => undefined),
  }
}

describe('infraQueueRetention', () => {
  it('trimQueueJobSet removes oldest excess completed jobs', async () => {
    const oldest = Array.from({ length: 7 }, (_, i) => fakeJob(String(i + 1)))
    const queue = {
      getJobCounts: jest.fn(async () => ({ completed: 12 })),
      getJobs: jest.fn(async () => oldest),
    } as unknown as Queue

    const removed = await trimQueueJobSet(queue, 'completed', 5)
    expect(removed).toBe(7)
    expect(queue.getJobs).toHaveBeenCalledWith(['completed'], 0, 6, true)
    for (const job of oldest) {
      expect(job.remove).toHaveBeenCalledTimes(1)
    }
  })

  it('trimQueueJobSet is a no-op when already at/under keep', async () => {
    const getJobs = jest.fn(async () => [])
    const queue = {
      getJobCounts: jest.fn(async () => ({ completed: 3 })),
      getJobs,
    } as unknown as Queue

    const removed = await trimQueueJobSet(queue, 'completed', 5)
    expect(removed).toBe(0)
    expect(getJobs).not.toHaveBeenCalled()
  })

  it('trimQueueJobSet skips jobs that fail to remove', async () => {
    const locked = {
      id: 'locked',
      remove: jest.fn(async () => {
        throw new Error('locked')
      }),
    }
    const ok = fakeJob('ok')
    const queue = {
      getJobCounts: jest.fn(async () => ({ failed: 4 })),
      getJobs: jest.fn(async () => [locked, ok]),
    } as unknown as Queue

    const removed = await trimQueueJobSet(queue, 'failed', 2)
    expect(removed).toBe(1)
    expect(locked.remove).toHaveBeenCalled()
    expect(ok.remove).toHaveBeenCalled()
  })

  it('trimInfraQueueRetention trims completed then failed', async () => {
    const oldestCompleted = [fakeJob('c1'), fakeJob('c2')]
    const oldestFailed = [fakeJob('f1')]
    let countsCalls = 0
    let jobsCalls = 0
    const queue = {
      getJobCounts: jest.fn(async () => {
        countsCalls += 1
        return countsCalls === 1 ? { completed: 5 } : { failed: 4 }
      }),
      getJobs: jest.fn(async () => {
        jobsCalls += 1
        return jobsCalls === 1 ? oldestCompleted : oldestFailed
      }),
    } as unknown as Queue

    const result = await trimInfraQueueRetention(queue, {
      keepCompleted: 3,
      keepFailed: 3,
    })

    expect(result).toEqual({ completedRemoved: 2, failedRemoved: 1 })
    expect(queue.getJobs).toHaveBeenNthCalledWith(1, ['completed'], 0, 1, true)
    expect(queue.getJobs).toHaveBeenNthCalledWith(2, ['failed'], 0, 0, true)
  })
})
