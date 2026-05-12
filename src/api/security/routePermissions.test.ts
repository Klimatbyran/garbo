import {
  CLIENT_API_PERMISSION_CODES,
  permissionsUsedInRules,
  resolveClientApiPermission,
  samplePathsForRegistryRules,
} from './routePermissions'

describe('routePermissions registry', () => {
  it('exposes a permission code for every rule', () => {
    const used = permissionsUsedInRules()
    for (const code of CLIENT_API_PERMISSION_CODES) {
      expect(used.has(code)).toBe(true)
    }
  })

  it('does not reference unknown permission codes in rules', () => {
    const allowed = new Set<string>(CLIENT_API_PERMISSION_CODES)
    for (const code of permissionsUsedInRules()) {
      expect(allowed.has(code)).toBe(true)
    }
  })

  it('resolves a permission for every synthetic sample path', () => {
    for (const { method, path } of samplePathsForRegistryRules()) {
      expect(resolveClientApiPermission(method, path)).not.toBeNull()
    }
  })

  it('matches company search and detail distinctly', () => {
    expect(resolveClientApiPermission('GET', '/api/companies/search')).toBe(
      'api.companies.search'
    )
    expect(
      resolveClientApiPermission('GET', '/api/companies/Q123')
    ).toBe('api.companies.read')
  })
})
