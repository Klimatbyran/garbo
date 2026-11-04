import { describe, it, expect, jest } from '@jest/globals'
import {
  createCollectionCache,
  isMissingCollectionError,
} from './chromaCollection'

function namedError(name: string, message = 'x') {
  const err = new Error(message)
  err.name = name
  return err
}

describe('isMissingCollectionError', () => {
  it('recognises Chroma not-found errors', () => {
    expect(isMissingCollectionError(namedError('ChromaNotFoundError'))).toBe(
      true
    )
    expect(isMissingCollectionError(namedError('InvalidCollectionError'))).toBe(
      true
    )
    expect(
      isMissingCollectionError(
        new Error('Collection 1234-abcd does not exist.')
      )
    ).toBe(true)
  })

  it('ignores other errors', () => {
    expect(
      isMissingCollectionError(namedError('ChromaConnectionError', 'down'))
    ).toBe(false)
    expect(isMissingCollectionError('not an error')).toBe(false)
  })
})

describe('createCollectionCache', () => {
  it('does not open the collection until first use, then reuses it', async () => {
    const open = jest.fn(async () => ({ id: 'a' }))
    const cache = createCollectionCache(open)
    expect(open).not.toHaveBeenCalled()

    await cache.get()
    await cache.get()

    expect(open).toHaveBeenCalledTimes(1)
  })

  it('retries the lookup after Chroma was down', async () => {
    const open = jest
      .fn<() => Promise<{ id: string }>>()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce({ id: 'a' })
    const cache = createCollectionCache(open)

    await expect(cache.get()).rejects.toThrow('ECONNREFUSED')
    await expect(cache.get()).resolves.toEqual({ id: 'a' })
  })

  it('looks the collection up again when it was deleted, and retries once', async () => {
    const open = jest
      .fn<() => Promise<{ id: string }>>()
      .mockResolvedValueOnce({ id: 'old' })
      .mockResolvedValueOnce({ id: 'new' })
    const cache = createCollectionCache(open)

    const fn = jest.fn(async (c: { id: string }) => {
      if (c.id === 'old') throw namedError('ChromaNotFoundError')
      return c.id
    })

    await expect(cache.withCollection(fn)).resolves.toBe('new')
    expect(fn).toHaveBeenCalledTimes(2)
    await expect(cache.get()).resolves.toEqual({ id: 'new' })
  })

  it('does not retry other errors', async () => {
    const open = jest.fn(async () => ({ id: 'a' }))
    const cache = createCollectionCache(open)
    const fn = jest.fn(async () => {
      throw new Error('boom')
    })

    await expect(cache.withCollection(fn)).rejects.toThrow('boom')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledTimes(1)
  })
})
