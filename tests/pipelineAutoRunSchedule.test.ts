import { jest } from '@jest/globals'

const getJobSchedulers =
  jest.fn<() => Promise<{ name: string; key: string }[]>>()
const removeJobScheduler = jest.fn<() => Promise<void>>()
const upsertJobScheduler = jest.fn<() => Promise<unknown>>()
const close = jest.fn<() => Promise<void>>()
const purgeLegacy = jest.fn<() => Promise<number>>()

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

jest.unstable_mockModule('../src/lib/purgeLegacyBullmqRepeatables', () => ({
  purgeLegacyBullmqRepeatables: purgeLegacy,
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
    purgeLegacy.mockResolvedValue(0)
  })

  it('when enabled, clears prior tick schedulers and upserts one tick', async () => {
    getJobSchedulers.mockResolvedValue([
      { name: 'tick', key: 'old-tick' },
      { name: 'other', key: 'keep' },
    ])

    await reconcilePipelineAutoRunSchedule(async () => true)

    expect(purgeLegacy).toHaveBeenCalled()
    expect(removeJobScheduler).toHaveBeenCalledWith('old-tick')
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

  it('when disabled, only removes tick-named schedulers and does not upsert', async () => {
    getJobSchedulers.mockResolvedValue([
      { name: 'tick', key: 't1' },
      { name: 'other', key: 'o1' },
    ])

    await reconcilePipelineAutoRunSchedule(async () => false)

    expect(removeJobScheduler).toHaveBeenCalledWith('t1')
    expect(removeJobScheduler).not.toHaveBeenCalledWith('o1')
    expect(upsertJobScheduler).not.toHaveBeenCalled()
  })

  it('re-reads enabled after mutate and heals a concurrent flip to disabled', async () => {
    let calls = 0
    getJobSchedulers
      .mockResolvedValueOnce([]) // enable: nothing to remove
      .mockResolvedValueOnce([{ name: 'tick', key: 'just-added' }]) // heal clear

    await reconcilePipelineAutoRunSchedule(async () => {
      calls += 1
      // First read: enable. Second read (post-mutate): disabled by concurrent PATCH.
      return calls === 1
    })

    expect(calls).toBe(2)
    expect(upsertJobScheduler).toHaveBeenCalledTimes(1)
    expect(removeJobScheduler).toHaveBeenCalledWith('just-added')
  })
})
