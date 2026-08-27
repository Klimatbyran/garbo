export const CLIENT_API_PERMISSION_CODES = [
  'api.companies.search',
  'api.companies.list',
  'api.companies.read',
  'api.internal.queue_archive',
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
  // Twin of api/queue-archive (staff JWT). See queue.archive.read.ts.
  {
    method: 'GET',
    type: 'prefix',
    path: '/api/internal-queue-archive',
    permission: 'api.internal.queue_archive',
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
