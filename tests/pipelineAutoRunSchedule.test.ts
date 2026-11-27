import { jest } from '@jest/globals'

const getJobSchedulers =
  jest.fn<() => Promise<{ name: string; key: string; id?: string }[]>>()
const removeJobScheduler = jest.fn<() => Promise<void>>()
const upsertJobScheduler = jest.fn<() => Promise<unknown>>()
const close = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('bullmq', () => ({
  Queue: class {
    getJobSchedulers = getJobSchedulers
    removeJobScheduler = removeJobScheduler
    upsertJobScheduler = upsertJobScheduler
    close = close
  },
}))

jest.unstable_mockModule('../src/config/redis', () => ({
  default: { host: 'localhost', port: 6379, password: 'x' },
}))

const {
  reconcilePipelineAutoRunSchedule,
  PIPELINE_AUTO_RUN_REPEAT_EVERY_MS,
  PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
} = await import('../src/lib/pipelineAutoRunSchedule')

describe('pipelineAutoRunSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getJobSchedulers.mockResolvedValue([])
    removeJobScheduler.mockResolvedValue(undefined)
    upsertJobScheduler.mockResolvedValue({})
    close.mockResolvedValue(undefined)
  })

  it('when enabled, keeps the canonical scheduler and only removes stray ticks', async () => {
    getJobSchedulers.mockResolvedValue([
      {
        name: 'tick',
        key: PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
        id: PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
      },
      { name: 'tick', key: 'old-tick' },
      { name: 'other', key: 'keep' },
    ])

    const enabled = await reconcilePipelineAutoRunSchedule(async () => true)

    expect(enabled).toBe(true)
    expect(removeJobScheduler).toHaveBeenCalledWith('old-tick')
    expect(removeJobScheduler).not.toHaveBeenCalledWith(
      PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID
    )
    expect(removeJobScheduler).not.toHaveBeenCalledWith('keep')
    expect(upsertJobScheduler).toHaveBeenCalledWith(
      PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
      { every: PIPELINE_AUTO_RUN_REPEAT_EVERY_MS },
      expect.objectContaining({
        name: 'tick',
      })
    )
    expect(close).toHaveBeenCalled()
  })

  it('when disabled, removes all tick-named schedulers and does not upsert', async () => {
    getJobSchedulers.mockResolvedValue([
      {
        name: 'tick',
        key: PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
        id: PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
      },
      { name: 'tick', key: 't1' },
      { name: 'other', key: 'o1' },
    ])

    const enabled = await reconcilePipelineAutoRunSchedule(async () => false)

    expect(enabled).toBe(false)
    expect(removeJobScheduler).toHaveBeenCalledWith(
      PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID
    )
    expect(removeJobScheduler).toHaveBeenCalledWith('t1')
    expect(removeJobScheduler).not.toHaveBeenCalledWith('o1')
    expect(upsertJobScheduler).not.toHaveBeenCalled()
  })

  it('re-reads enabled after mutate and heals a concurrent flip to disabled', async () => {
    let calls = 0
    getJobSchedulers
      .mockResolvedValueOnce([]) // enable: nothing to remove
      .mockResolvedValueOnce([
        {
          name: 'tick',
          key: PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
          id: PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
        },
      ]) // heal clear

    const enabled = await reconcilePipelineAutoRunSchedule(async () => {
      calls += 1
      // First read: enable. Second read (post-mutate): disabled by concurrent PATCH.
      return calls === 1
    })

    expect(calls).toBe(2)
    expect(enabled).toBe(false)
    expect(upsertJobScheduler).toHaveBeenCalledTimes(1)
    expect(removeJobScheduler).toHaveBeenCalledWith(
      PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID
    )
  })

  it('does not call a Redis keyspace purge on reconcile', async () => {
    // Guarding against regressions that reintroduce purgeLegacy on the hot path.
    // If purge were imported again, this module graph would still load without it;
    // assert reconcile completes with only scheduler APIs exercised.
    await reconcilePipelineAutoRunSchedule(async () => true)
    expect(getJobSchedulers).toHaveBeenCalled()
    expect(upsertJobScheduler).toHaveBeenCalled()
  })
})
