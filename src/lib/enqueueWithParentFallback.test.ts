import { describe, it, expect, jest } from '@jest/globals'
import { enqueueWithParentFallback } from './DiffWorker'

describe('enqueueWithParentFallback', () => {
  it('retries without parent when BullMQ reports a missing parent key', async () => {
    const add = jest.fn(
      async (
        _name: string,
        _data: Record<string, unknown>,
        _opts?: Record<string, unknown>
      ) => ({})
    )
    add
      .mockRejectedValueOnce(
        new Error('Missing key for parent job extractGleifIds:abc. addJob')
      )
      .mockResolvedValueOnce({})

    const job = {
      id: 'abc',
      queueName: 'extractGleifIds',
      log: jest.fn(async () => undefined),
    }

    await enqueueWithParentFallback(
      job as any,
      { add },
      'company - GLEIF identifiers',
      { lei: '5493001KJTIIGC8Y1R12' },
      { attempts: 3 }
    )

    expect(add).toHaveBeenCalledTimes(2)
    expect(add.mock.calls[0][2]).toEqual(
      expect.objectContaining({
        parent: { id: 'abc', queue: 'extractGleifIds' },
      })
    )
    expect(add.mock.calls[1][2]).toEqual(
      expect.not.objectContaining({ parent: expect.anything() })
    )
    expect(job.log).toHaveBeenCalledWith(
      expect.stringContaining('parent missing')
    )
  })
})
