import { describe, expect, it } from '@jest/globals'

import {
  CLIENT_API_COMPANY_SCOPE_SWEDEN,
  companyInClientApiScope,
  filterCompaniesByClientApiScope,
  isClientApiKeyExpired,
} from './clientApiCompanyScope'

describe('clientApiCompanyScope', () => {
  it('allows all companies when scope is null/undefined', () => {
    expect(companyInClientApiScope({ tags: ['germany'] }, null)).toBe(true)
    expect(companyInClientApiScope({ tags: [] }, undefined)).toBe(true)
  })

  it('requires sweden tag when scope is sweden', () => {
    expect(
      companyInClientApiScope(
        { tags: ['sweden', 'large-cap'] },
        CLIENT_API_COMPANY_SCOPE_SWEDEN
      )
    ).toBe(true)
    expect(
      companyInClientApiScope({ tags: ['norway'] }, CLIENT_API_COMPANY_SCOPE_SWEDEN)
    ).toBe(false)
    expect(
      companyInClientApiScope({ tags: null }, CLIENT_API_COMPANY_SCOPE_SWEDEN)
    ).toBe(false)
  })

  it('filters company lists by scope', () => {
    const companies = [
      { id: '1', tags: ['sweden'] },
      { id: '2', tags: ['germany'] },
      { id: '3', tags: ['sweden', 'sp-500'] },
    ]
    expect(filterCompaniesByClientApiScope(companies, null)).toHaveLength(3)
    expect(
      filterCompaniesByClientApiScope(companies, CLIENT_API_COMPANY_SCOPE_SWEDEN).map(
        (c) => c.id
      )
    ).toEqual(['1', '3'])
  })
})

describe('isClientApiKeyExpired', () => {
  const now = 1_700_000_000_000

  it('treats null/undefined as not expired', () => {
    expect(isClientApiKeyExpired(null, now)).toBe(false)
    expect(isClientApiKeyExpired(undefined, now)).toBe(false)
  })

  it('treats future expiresAt as not expired', () => {
    expect(isClientApiKeyExpired(new Date(now + 60_000), now)).toBe(false)
  })

  it('treats past or equal expiresAt as expired', () => {
    expect(isClientApiKeyExpired(new Date(now - 1), now)).toBe(true)
    expect(isClientApiKeyExpired(new Date(now), now)).toBe(true)
  })
})
