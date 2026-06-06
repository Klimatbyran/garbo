import companyWikidata from '../../data/klimatkollen-company-wikidata.json'

type CompanyEntry = string | { wikidataId: string; tags?: string[] }

const companyWikidataData = companyWikidata as Record<string, CompanyEntry>

function normalizeLookupName(companyName: string): string {
  return companyName.replace(/,/g, ' ').trim().replace(/\s+/g, ' ')
}

function buildKnownIdIndex(): Map<string, string> {
  const index = new Map<string, string>()
  for (const [name, entry] of Object.entries(companyWikidataData)) {
    const wikidataId = typeof entry === 'string' ? entry : entry.wikidataId
    const normalized = normalizeLookupName(name)
    index.set(normalized, wikidataId)
    index.set(normalized.toLocaleLowerCase('sv-SE'), wikidataId)
  }
  return index
}

const knownIdByName = buildKnownIdIndex()

export function lookupKnownCompanyWikidataIdFromRegistry(
  companyName: string
): string | null {
  const normalized = normalizeLookupName(companyName)
  if (!normalized) return null
  return (
    knownIdByName.get(normalized) ??
    knownIdByName.get(normalized.toLocaleLowerCase('sv-SE')) ??
    null
  )
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

    const want = normalizeLookupName(companyName).toLocaleLowerCase('sv-SE')
    const exact = companies.find(
      (c: { name?: string; wikidataId?: string }) =>
        typeof c?.name === 'string' &&
        normalizeLookupName(c.name).toLocaleLowerCase('sv-SE') === want &&
        typeof c.wikidataId === 'string'
    )
    if (exact?.wikidataId) return exact.wikidataId

    if (companies.length === 1 && typeof companies[0]?.wikidataId === 'string') {
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
