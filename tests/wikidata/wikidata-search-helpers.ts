import companyWikidata from './data/klimatkollen-company-wikidata.json'

export type CompanyEntry = string | { wikidataId: string; tags?: string[] }

export type NamedWikidataCase = Readonly<{
  companyName: string
  klimatkollenWikidataId: string
}>

export const companyWikidataData = companyWikidata as Record<
  string,
  CompanyEntry
>

export function casesFromDataByTag(tag: string): [string, string][] {
  const out: [string, string][] = []
  for (const [name, val] of Object.entries(companyWikidataData)) {
    const wikidataId = typeof val === 'string' ? val : val.wikidataId
    const tags =
      typeof val === 'object' && val !== null && Array.isArray(val.tags)
        ? val.tags
        : []
    if (tags.includes(tag)) {
      out.push([name, wikidataId])
    }
  }
  return [...out].sort(([a], [b]) => a.localeCompare(b, 'sv'))
}

export function regularCasesForTag(
  tag: string,
  specialCases: ReadonlyArray<NamedWikidataCase>,
  emptyResults: ReadonlyArray<NamedWikidataCase>,
  impossibleToFind: ReadonlyArray<NamedWikidataCase> = [],
  wrongWinnerCases: ReadonlyArray<NamedWikidataCase> = []
): [string, string][] {
  const excluded = new Set([
    ...specialCases.map((c) => c.companyName),
    ...emptyResults.map((c) => c.companyName),
    ...impossibleToFind.map((c) => c.companyName),
    ...wrongWinnerCases.map((c) => c.companyName),
  ])
  return casesFromDataByTag(tag).filter(([name]) => !excluded.has(name))
}
