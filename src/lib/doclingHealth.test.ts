import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { doclingHealthUrl, isDoclingHealthy } from './doclingHealth'

describe('doclingHealthUrl', () => {
  it('strips a trailing /v1 so health is checked at the root', () => {
    expect(doclingHealthUrl('http://localhost:5001/v1')).toBe(
      'http://localhost:5001/health'
    )
    expect(doclingHealthUrl('https://docling.example.com/v1/')).toBe(
      'https://docling.example.com/health'
    )
  })

  it('leaves a base URL without /v1 alone', () => {
    expect(doclingHealthUrl('https://docling.example.com')).toBe(
      'https://docling.example.com/health'
    )
    expect(doclingHealthUrl('https://docling.example.com/')).toBe(
      'https://docling.example.com/health'
    )
  })
})

describe('isDoclingHealthy', () => {
  const realFetch = global.fetch

  afterEach(() => {
    global.fetch = realFetch
  })

  function mockFetch(impl: () => Promise<Response>) {
    const fn = jest.fn<(url: string) => Promise<Response>>(impl)
    global.fetch = fn as unknown as typeof fetch
    return fn
  }

  it('is true on 2xx and calls /health without /v1', async () => {
    const fn = mockFetch(async () => new Response('{}', { status: 200 }))
    await expect(isDoclingHealthy('http://localhost:5001/v1')).resolves.toBe(
      true
    )
    expect(fn.mock.calls[0]?.[0]).toBe('http://localhost:5001/health')
  })

  it.each([401, 404, 502])('is false on HTTP %i', async (status) => {
    mockFetch(async () => new Response('', { status }))
    await expect(isDoclingHealthy('http://localhost:5001/v1')).resolves.toBe(
      false
    )
  })

  it('is false when the request throws', async () => {
    mockFetch(async () => {
      throw new TypeError('fetch failed')
    })
    await expect(isDoclingHealthy('http://localhost:5001/v1')).resolves.toBe(
      false
    )
  })
})
