import { jest } from '@jest/globals'

const getRepeatableJobs = jest.fn<() => Promise<{ name: string; key: string }[]>>()
const removeRepeatableByKey = jest.fn<() => Promise<void>>()
const add = jest.fn<() => Promise<unknown>>()
const close = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('bullmq', () => ({
  Queue: class {
    getRepeatableJobs = getRepeatableJobs
    removeRepeatableByKey = removeRepeatableByKey
    add = add
    close = close
  },
}))

jest.unstable_mockModule('../src/config/redis', () => ({
  default: { host: 'localhost', port: 6379, password: 'x' },
}))

const {
  reconcilePipelineAutoRunSchedule,
  clearPipelineAutoRunRepeatableTicks,
  PIPELINE_AUTO_RUN_REPEAT_EVERY_MS,
} = await import('../src/lib/pipelineAutoRunSchedule')

describe('pipelineAutoRunSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getRepeatableJobs.mockResolvedValue([])
    removeRepeatableByKey.mockResolvedValue(undefined)
    add.mockResolvedValue({})
    close.mockResolvedValue(undefined)
  })

  it('when enabled, clears prior tick schedules and adds one repeatable tick', async () => {
    getRepeatableJobs.mockResolvedValue([
      { name: 'tick', key: 'old-tick' },
      { name: 'other', key: 'keep' },
    ])

    await reconcilePipelineAutoRunSchedule(async () => true)

    expect(removeRepeatableByKey).toHaveBeenCalledWith('old-tick')
    expect(removeRepeatableByKey).not.toHaveBeenCalledWith('keep')
    expect(add).toHaveBeenCalledWith(
      'tick',
      {},
      expect.objectContaining({
        repeat: { every: PIPELINE_AUTO_RUN_REPEAT_EVERY_MS },
      })
    )
    expect(close).toHaveBeenCalled()
  })

  it('when disabled, removes tick schedules and does not add', async () => {
    getRepeatableJobs.mockResolvedValue([{ name: 'tick', key: 't1' }])

    await reconcilePipelineAutoRunSchedule(async () => false)

    expect(removeRepeatableByKey).toHaveBeenCalledWith('t1')
    expect(add).not.toHaveBeenCalled()
  })

  it('re-reads enabled after mutate and heals a concurrent flip to disabled', async () => {
    let calls = 0
    getRepeatableJobs
      .mockResolvedValueOnce([]) // ensure: nothing to remove
      .mockResolvedValueOnce([{ name: 'tick', key: 'just-added' }]) // heal clear

    await reconcilePipelineAutoRunSchedule(async () => {
      calls += 1
      // First read: enable. Second read (post-mutate): disabled by concurrent PATCH.
      return calls === 1
    })

    expect(calls).toBe(2)
    expect(add).toHaveBeenCalledTimes(1)
    expect(removeRepeatableByKey).toHaveBeenCalledWith('just-added')
  })

  it('clearPipelineAutoRunRepeatableTicks only removes tick-named schedules', async () => {
    getRepeatableJobs.mockResolvedValue([
      { name: 'tick', key: 't1' },
      { name: 'other', key: 'o1' },
    ])

    await clearPipelineAutoRunRepeatableTicks()

    expect(removeRepeatableByKey).toHaveBeenCalledWith('t1')
    expect(removeRepeatableByKey).not.toHaveBeenCalledWith('o1')
    expect(add).not.toHaveBeenCalled()
  })
})
