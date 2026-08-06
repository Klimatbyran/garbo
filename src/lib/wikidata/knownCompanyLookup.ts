import {
  lookupRegistryWikidataId,
  normalizeCompanyName,
} from './companyRegistry'

export function lookupKnownCompanyWikidataIdFromRegistry(
  companyName: string
): string | null {
  return lookupRegistryWikidataId(companyName)
}

async function lookupKnownCompanyWikidataIdFromApi(
  companyName: string
): Promise<string | null> {
  try {
    const { apiFetch } = await import('../api')
    const companies = await apiFetch(
      `/companies/search?q=${encodeURIComponent(companyName)}`
    )
    if (!Array.isArray(companies) || companies.length === 0) return null

    const want = normalizeCompanyName(companyName).toLocaleLowerCase('sv-SE')
    const exact = companies.find(
      (c: { name?: string; wikidataId?: string }) =>
        typeof c?.name === 'string' &&
        normalizeCompanyName(c.name).toLocaleLowerCase('sv-SE') === want &&
        typeof c.wikidataId === 'string'
    )
    if (exact?.wikidataId) return exact.wikidataId

    if (
      companies.length === 1 &&
      typeof companies[0]?.wikidataId === 'string'
    ) {
      return companies[0].wikidataId
    }
  } catch {
    return null
  }
  return null
}

/**
 * Resolve a Klimatkollen-known Wikidata id before hitting Wikidata search.
 * Checks the bundled registry first, then the Garbo API company search.
 */
export async function lookupKnownCompanyWikidataId(
  companyName: string
): Promise<string | null> {
  const fromRegistry = lookupKnownCompanyWikidataIdFromRegistry(companyName)
  if (fromRegistry) return fromRegistry
  return lookupKnownCompanyWikidataIdFromApi(companyName)
}
