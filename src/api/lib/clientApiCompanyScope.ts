/** Supported ClientApiKey.companyScope values. Null/undefined = unrestricted. */
export type ClientApiCompanyScope = 'sweden' | null | undefined

export const CLIENT_API_COMPANY_SCOPE_SWEDEN = 'sweden' as const

export const TRIAL_KEY_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function isClientApiKeyExpired(
  expiresAt: Date | null | undefined,
  nowMs: number = Date.now()
): boolean {
  return expiresAt != null && expiresAt.getTime() <= nowMs
}

export function companyInClientApiScope(
  company: { tags?: string[] | null },
  scope: ClientApiCompanyScope
): boolean {
  if (scope == null) return true
  if (scope === CLIENT_API_COMPANY_SCOPE_SWEDEN) {
    return (company.tags ?? []).includes('sweden')
  }
  return true
}

export function filterCompaniesByClientApiScope<
  T extends { tags?: string[] | null },
>(companies: T[], scope: ClientApiCompanyScope): T[] {
  if (scope == null) return companies
  return companies.filter((c) => companyInClientApiScope(c, scope))
}
