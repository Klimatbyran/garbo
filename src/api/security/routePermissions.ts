export const CLIENT_API_PERMISSION_CODES = [
  'api.companies.search',
  'api.companies.export',
  'api.companies.list',
  'api.companies.read',
  'api.internal.companies',
  'api.internal.municipalities',
  'api.municipalities.read',
  'api.municipalities.export',
  'api.regions.read',
  'api.regions.export',
  'api.nation.read',
  'api.reporting_period.years',
  'api.mailing_list.download_request',
  'api.screenshots.read',
  'api.newsletters.download',
  'api.global_search.search',
] as const

export type ClientApiPermissionCode =
  (typeof CLIENT_API_PERMISSION_CODES)[number]

type Method = string

type Rule = {
  method: Method
  type: 'exact' | 'prefix'
  path: string
  permission: ClientApiPermissionCode
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

/** Ordered rules — exported for tests. */
export const clientApiRouteRules: Rule[] = [
  {
    method: 'GET',
    type: 'exact',
    path: '/api/companies/search',
    permission: 'api.companies.search',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/companies/export',
    permission: 'api.companies.export',
  },
  {
    method: 'GET',
    type: 'exact',
    path: '/api/companies',
    permission: 'api.companies.list',
  },
  {
    method: 'GET',
    type: 'exact',
    path: '/api/companies/',
    permission: 'api.companies.list',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/companies/',
    permission: 'api.companies.read',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/internal-companies',
    permission: 'api.internal.companies',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/internal-municipalities',
    permission: 'api.internal.municipalities',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/municipalities/export',
    permission: 'api.municipalities.export',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/municipalities/',
    permission: 'api.municipalities.read',
  },
  {
    method: 'GET',
    type: 'exact',
    path: '/api/municipalities',
    permission: 'api.municipalities.read',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/regions/export',
    permission: 'api.regions.export',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/regions/',
    permission: 'api.regions.read',
  },
  {
    method: 'GET',
    type: 'exact',
    path: '/api/regions',
    permission: 'api.regions.read',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/nation/',
    permission: 'api.nation.read',
  },
  {
    method: 'GET',
    type: 'exact',
    path: '/api/nation',
    permission: 'api.nation.read',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/reporting-period',
    permission: 'api.reporting_period.years',
  },
  {
    method: 'POST',
    type: 'prefix',
    path: '/api/download-request',
    permission: 'api.mailing_list.download_request',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/screenshots/',
    permission: 'api.screenshots.read',
  },
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/newsletters',
    permission: 'api.newsletters.download',
  },
  {
    method: 'POST',
    type: 'prefix',
    path: '/api/global-search',
    permission: 'api.global_search.search',
  },
]

export function resolveClientApiPermission(
  method: string,
  pathnameRaw: string
): ClientApiPermissionCode | null {
  const pathname = normalizePath(pathnameRaw)
  const upper = method.toUpperCase()

  for (const rule of clientApiRouteRules) {
    if (rule.method !== upper) continue
    if (rule.type === 'exact' && pathname === rule.path) {
      return rule.permission
    }
    if (rule.type === 'prefix' && pathname.startsWith(rule.path)) {
      return rule.permission
    }
  }
  return null
}

export function isClientApiPermissionCode(
  s: string
): s is ClientApiPermissionCode {
  return (CLIENT_API_PERMISSION_CODES as readonly string[]).includes(s)
}

/** One synthetic path per registry rule — used by Jest to keep rules self-consistent. */
export function samplePathsForRegistryRules(): {
  method: string
  path: string
}[] {
  const out: { method: string; path: string }[] = []
  for (const rule of clientApiRouteRules) {
    if (rule.type === 'exact') {
      out.push({ method: rule.method, path: rule.path })
    } else {
      let p: string
      // TODO: remove hardcoded special case — drive sample path from rule metadata instead
      if (rule.method === 'POST' && rule.path === '/api/download-request') {
        p = '/api/download-request'
      } else if (rule.path.endsWith('/')) {
        p = `${rule.path}synthetic`
      } else {
        p = `${rule.path}/synthetic`
      }
      out.push({ method: rule.method, path: p })
    }
  }
  return out
}

export function permissionsUsedInRules(): Set<ClientApiPermissionCode> {
  return new Set(clientApiRouteRules.map((r) => r.permission))
}
