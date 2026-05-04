import {
  COMPLETED_JOB_RETENTION_SECONDS,
  FAILED_JOB_RETENTION_SECONDS,
  defaultQueueJobOptions,
} from '../src/lib/queueRetention'

describe('queue retention defaults', () => {
  test('uses aggressive completed job retention', () => {
    expect(COMPLETED_JOB_RETENTION_SECONDS).toBe(24 * 60 * 60)
    expect(defaultQueueJobOptions?.removeOnComplete).toEqual({
      age: 24 * 60 * 60,
      count: 1000,
    })
  })

  test('uses bounded failed job retention', () => {
    expect(FAILED_JOB_RETENTION_SECONDS).toBe(7 * 24 * 60 * 60)
    expect(defaultQueueJobOptions?.removeOnFail).toEqual({
      age: 7 * 24 * 60 * 60,
      count: 3000,
    })
  })
})
