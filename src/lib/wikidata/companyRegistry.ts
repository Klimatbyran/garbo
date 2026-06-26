import companyWikidata from '../../data/klimatkollen-company-wikidata.json'

export type CompanyRegistryEntry =
  | string
  | { wikidataId: string; tags?: string[] }

export const companyRegistry = companyWikidata as Record<
  string,
  CompanyRegistryEntry
>

/** Shared normalizer for registry keys and Wikidata search queries. */
export function normalizeCompanyName(companyName: string): string {
  return companyName.replace(/,/g, ' ').trim().replace(/\s+/g, ' ')
}

export function wikidataIdFromEntry(entry: CompanyRegistryEntry): string {
  return typeof entry === 'string' ? entry : entry.wikidataId
}

export function tagsFromEntry(entry: CompanyRegistryEntry): string[] {
  return typeof entry === 'object' &&
    entry !== null &&
    Array.isArray(entry.tags)
    ? entry.tags
    : []
}

function buildKnownIdIndex(): Map<string, string> {
  const index = new Map<string, string>()
  for (const [name, entry] of Object.entries(companyRegistry)) {
    const wikidataId = wikidataIdFromEntry(entry)
    const normalized = normalizeCompanyName(name)
    index.set(normalized, wikidataId)
    index.set(normalized.toLocaleLowerCase('sv-SE'), wikidataId)
  }
  return index
}

const knownIdByName = buildKnownIdIndex()

export function lookupRegistryWikidataId(companyName: string): string | null {
  const normalized = normalizeCompanyName(companyName)
  if (!normalized) return null
  return (
    knownIdByName.get(normalized) ??
    knownIdByName.get(normalized.toLocaleLowerCase('sv-SE')) ??
    null
  )
}

export function companiesWithTag(tag: string): [string, string][] {
  const out: [string, string][] = []
  for (const [name, entry] of Object.entries(companyRegistry)) {
    if (tagsFromEntry(entry).includes(tag)) {
      out.push([name, wikidataIdFromEntry(entry)])
    }
  }
  return [...out].sort(([a], [b]) => a.localeCompare(b, 'sv'))
}
