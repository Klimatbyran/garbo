import { companiesWithTag } from '../../src/lib/wikidata/companyRegistry'

export type NamedWikidataCase = Readonly<{
  companyName: string
  klimatkollenWikidataId: string
}>

export function casesFromDataByTag(tag: string): [string, string][] {
  return companiesWithTag(tag)
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
