import { describe, expect, it } from '@jest/globals'

import { normalizeClientApiPathname } from './clientApiKeyGate'

describe('normalizeClientApiPathname', () => {
  it('decodes percent-encoded path segments for permission matching', () => {
    expect(normalizeClientApiPathname('/api/%69nternal-companies')).toBe(
      '/api/internal-companies'
    )
    expect(normalizeClientApiPathname('/api/companies?limit=1')).toBe(
      '/api/companies'
    )
  })

  it('leaves already-decoded paths unchanged', () => {
    expect(normalizeClientApiPathname('/api/companies')).toBe('/api/companies')
  })

  it('collapses duplicate slashes', () => {
    expect(normalizeClientApiPathname('/api//companies')).toBe('/api/companies')
  })

  it('keeps raw pathname when percent-encoding is invalid', () => {
    expect(normalizeClientApiPathname('/api/%E0%A4%A')).toBe('/api/%E0%A4%A')
  })
})
