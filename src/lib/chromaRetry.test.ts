import { describe, it, expect, jest } from '@jest/globals'
import {
  describeChromaError,
  isRetryableChromaError,
  withChromaRetry,
} from './chromaRetry'

const noLog = () => {}
const noSleep = async () => {}

function namedError(name: string, message: string, cause?: unknown) {
  const err = new Error(message, { cause })
  err.name = name
  return err
}

describe('describeChromaError', () => {
  it('includes the error name, message and cause', () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED 10.0.0.1'), {
      code: 'ECONNREFUSED',
    })
    expect(
      describeChromaError(
        namedError('ChromaConnectionError', 'Failed to connect', cause)
      )
    ).toBe(
      'ChromaConnectionError: Failed to connect (cause: Error ECONNREFUSED connect ECONNREFUSED 10.0.0.1)'
    )
  })

  it('follows nested causes down to the socket error', () => {
    const socketError = Object.assign(
      new Error('connect ECONNREFUSED 10.43.12.7:8000'),
      { code: 'ECONNREFUSED' }
    )
    const fetchError = new TypeError('fetch failed', { cause: socketError })
    expect(
      describeChromaError(
        namedError('ChromaConnectionError', 'Failed to connect', fetchError)
      )
    ).toBe(
      'ChromaConnectionError: Failed to connect (cause: TypeError fetch failed → Error ECONNREFUSED connect ECONNREFUSED 10.43.12.7:8000)'
    )
  })

  it('stops on a cause cycle', () => {
    const a = new Error('a')
    const b = new Error('b', { cause: a })
    a.cause = b
    expect(describeChromaError(a)).toBe('Error: a (cause: Error b)')
  })

  it('handles non-errors', () => {
    expect(describeChromaError('boom')).toBe('boom')
  })
})

describe('isRetryableChromaError', () => {
  it('does not retry client-side errors', () => {
    expect(isRetryableChromaError(namedError('ChromaValueError', 'x'))).toBe(
      false
    )
  })

  it('retries connection and unknown errors', () => {
    expect(
      isRetryableChromaError(namedError('ChromaConnectionError', 'x'))
    ).toBe(true)
    expect(isRetryableChromaError(new Error('fetch failed'))).toBe(true)
  })
})

describe('withChromaRetry', () => {
  it('retries until the call succeeds', async () => {
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce('ok')

    await expect(
      withChromaRetry('query (u)', fn, noLog, { sleep: noSleep })
    ).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('gives up with a message naming the operation and the reason', async () => {
    const fn = jest.fn(async () => {
      throw namedError('ChromaServerError', 'database or disk is full')
    })

    await expect(
      withChromaRetry('query (u)', fn, noLog, {
        maxAttempts: 3,
        sleep: noSleep,
      })
    ).rejects.toThrow(
      'ChromaDB query (u) failed after 3 attempts: ChromaServerError: database or disk is full'
    )
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('fails right away on errors retrying cannot fix', async () => {
    const fn = jest.fn(async () => {
      throw namedError('ChromaValueError', 'bad where filter')
    })

    await expect(
      withChromaRetry('query (u)', fn, noLog, { sleep: noSleep })
    ).rejects.toThrow(
      'ChromaDB query (u) failed: ChromaValueError: bad where filter'
    )
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
