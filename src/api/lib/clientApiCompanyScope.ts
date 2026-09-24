/** Supported ClientApiKey.companyScope values. Null/undefined = unrestricted. */
export type ClientApiCompanyScope = 'sweden' | null | undefined

export const CLIENT_API_COMPANY_SCOPE_SWEDEN = 'sweden' as const

export const KNOWN_CLIENT_API_COMPANY_SCOPES = [
  CLIENT_API_COMPANY_SCOPE_SWEDEN,
] as const

export const TRIAL_KEY_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function isClientApiKeyExpired(
  expiresAt: Date | null | undefined,
  nowMs: number = Date.now()
): boolean {
  return expiresAt != null && expiresAt.getTime() <= nowMs
}

/** Null/undefined = unrestricted; known scopes only. Unknown values are rejected. */
export function isKnownClientApiCompanyScope(
  scope: string | null | undefined
): boolean {
  if (scope == null) return true
  return (KNOWN_CLIENT_API_COMPANY_SCOPES as readonly string[]).includes(scope)
}

/**
 * Whether a company is visible under the key's companyScope.
 * Unknown scopes fail closed (no companies match).
 */
export function companyInClientApiScope(
  company: { tags?: string[] | null },
  scope: ClientApiCompanyScope | string | null | undefined
): boolean {
  if (scope == null) return true
  if (scope === CLIENT_API_COMPANY_SCOPE_SWEDEN) {
    return (company.tags ?? []).includes('sweden')
  }
  // Fail closed: unrecognized scope grants no company access.
  return false
}

export function filterCompaniesByClientApiScope<
  T extends { tags?: string[] | null },
>(
  companies: T[],
  scope: ClientApiCompanyScope | string | null | undefined
): T[] {
  if (scope == null) return companies
  return companies.filter((c) => companyInClientApiScope(c, scope))
}

/** ETag / cache key segment so scoped and full responses never share validators. */
export function clientApiCompanyScopeEtagSegment(
  scope: string | null | undefined
): string {
  return scope == null ? 'all' : `scope=${scope}`
}
