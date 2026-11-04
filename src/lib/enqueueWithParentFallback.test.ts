import { describe, it, expect, jest } from '@jest/globals'
import {
  enqueueFollowUp,
  enqueueSaveToAPIWithParentFallback,
} from './DiffWorker'

const saveAdd = jest.fn(async (..._args: unknown[]) => ({}))

jest.mock('../workers/saveToAPI', () => ({
  __esModule: true,
  default: {
    queue: {
      add: (...args: unknown[]) => saveAdd(...args),
    },
  },
}))

describe('enqueueFollowUp', () => {
  it('enqueues with pipeline defaults and without a parent link', async () => {
    const add = jest.fn(async (..._args: unknown[]) => ({}))

    await enqueueFollowUp(
      { add: add as any },
      'company - GLEIF identifiers',
      { lei: '5493001KJTIIGC8Y1R12', url: 'https://example.com/r.pdf' },
      { attempts: 3 }
    )

    expect(add).toHaveBeenCalledTimes(1)
    const opts = add.mock.calls[0]?.[2] as Record<string, unknown>
    expect(add.mock.calls[0]?.[0]).toBe('company - GLEIF identifiers')
    expect(opts).toEqual(
      expect.objectContaining({
        attempts: 3,
        removeOnComplete: false,
      })
    )
    expect(opts).toEqual(
      expect.not.objectContaining({ parent: expect.anything() })
    )
  })
})

describe('enqueueSaveToAPIWithParentFallback', () => {
  it('enqueues saveToAPI without attempting a parent link', async () => {
    saveAdd.mockClear()
    saveAdd.mockResolvedValue({})

    await enqueueSaveToAPIWithParentFallback(
      { id: 'abc', queueName: 'diffGleifIds' } as any,
      'company identifiers/batch',
      {
        url: 'https://example.com/r.pdf',
        apiSubEndpoint: 'identifiers/batch',
      }
    )

    expect(saveAdd).toHaveBeenCalledTimes(1)
    const opts = saveAdd.mock.calls[0]?.[2] as Record<string, unknown>
    expect(opts).toEqual(
      expect.not.objectContaining({ parent: expect.anything() })
    )
  })
})
