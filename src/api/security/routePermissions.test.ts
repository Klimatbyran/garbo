import {
  CLIENT_API_PERMISSION_CODES,
  clientApiRouteRules,
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

describe('clientApiRouteRules catalog integrity', () => {
  it('has no duplicate (method, type, path) triples', () => {
    const seen = new Set<string>()
    for (const rule of clientApiRouteRules) {
      const key = `${rule.method}:${rule.type}:${rule.path}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('covers every permission code at least once', () => {
    const usedInCatalog = new Set(clientApiRouteRules.map((r) => r.permission))
    for (const code of CLIENT_API_PERMISSION_CODES) {
      expect(usedInCatalog.has(code)).toBe(true)
    }
  })

  it('each entry has the required fields', () => {
    for (const rule of clientApiRouteRules) {
      expect(typeof rule.method).toBe('string')
      expect(['exact', 'prefix']).toContain(rule.type)
      expect(rule.path.startsWith('/api/')).toBe(true)
      expect(typeof rule.permission).toBe('string')
    }
  })
})
