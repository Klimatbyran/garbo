import { normalizeCompanyNameForMatch } from './companyLinkResolve'
import { normalizeLei } from './normalizeLei'

export type CompanyDuplicateRow = {
  id: string
  name: string
  wikidataId: string | null
  lei: string | null
  reportingPeriodCount: number
  companyReportCount: number
}

export type DuplicateDetectionReason =
  | 'normalized_name'
  | 'lei'
  | 'wikidata_conflict'

export type DuplicateCompanyGroup = {
  reason: DuplicateDetectionReason
  /** Grouping key (normalized name, LEI, etc.) */
  key: string
  companies: CompanyDuplicateRow[]
}

export type DuplicateCompanyReport = {
  totalCompanies: number
  groupCount: number
  companiesInGroups: number
  byReason: Record<DuplicateDetectionReason, number>
  groups: DuplicateCompanyGroup[]
}

type IdentifierRow = {
  companyId: string
  type: 'LEI' | 'WIKIDATA'
  value: string
}

function groupByKey<T>(
  items: T[],
  keyFor: (item: T) => string | null
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFor(item)
    if (!key) continue
    const bucket = groups.get(key) ?? []
    bucket.push(item)
    groups.set(key, bucket)
  }
  return groups
}

function collectLeiValues(
  company: CompanyDuplicateRow,
  identifiersByCompanyId: Map<string, IdentifierRow[]>
): string[] {
  const values = new Set<string>()
  const fromColumn = normalizeLei(company.lei)
  if (fromColumn) values.add(fromColumn)

  for (const row of identifiersByCompanyId.get(company.id) ?? []) {
    if (row.type !== 'LEI') continue
    const normalized = normalizeLei(row.value)
    if (normalized) values.add(normalized)
  }

  return [...values]
}

function findNormalizedNameGroups(
  companies: CompanyDuplicateRow[],
  minSize: number
): DuplicateCompanyGroup[] {
  const grouped = groupByKey(companies, (company) => {
    const normalized = normalizeCompanyNameForMatch(company.name)
    return normalized.length > 0 ? normalized : null
  })

  const result: DuplicateCompanyGroup[] = []
  for (const [key, members] of grouped) {
    if (members.length < minSize) continue
    result.push({
      reason: 'normalized_name',
      key,
      companies: members,
    })
  }

  return result.toSorted((a, b) => b.companies.length - a.companies.length)
}

function findLeiGroups(
  companies: CompanyDuplicateRow[],
  identifiers: IdentifierRow[],
  minSize: number
): DuplicateCompanyGroup[] {
  const identifiersByCompanyId = new Map<string, IdentifierRow[]>()
  for (const row of identifiers) {
    const bucket = identifiersByCompanyId.get(row.companyId) ?? []
    bucket.push(row)
    identifiersByCompanyId.set(row.companyId, bucket)
  }

  const leiToCompanies = new Map<string, CompanyDuplicateRow[]>()
  for (const company of companies) {
    for (const lei of collectLeiValues(company, identifiersByCompanyId)) {
      const bucket = leiToCompanies.get(lei) ?? []
      bucket.push(company)
      leiToCompanies.set(lei, bucket)
    }
  }

  const result: DuplicateCompanyGroup[] = []
  for (const [lei, members] of leiToCompanies) {
    const uniqueById = [...new Map(members.map((c) => [c.id, c])).values()]
    if (uniqueById.length < minSize) continue
    result.push({
      reason: 'lei',
      key: lei,
      companies: uniqueById.toSorted((a, b) => a.name.localeCompare(b.name)),
    })
  }

  return result.toSorted((a, b) => b.companies.length - a.companies.length)
}

/**
 * Same normalized name but different non-null Wikidata Q-ids — strong duplicate signal
 * (e.g. "Alfa Laval" vs "Alfa Laval AB" created as separate rows).
 */
function findWikidataConflictGroups(
  nameGroups: DuplicateCompanyGroup[]
): DuplicateCompanyGroup[] {
  const result: DuplicateCompanyGroup[] = []

  for (const group of nameGroups) {
    const wikidataIds = new Set(
      group.companies
        .map((company) => company.wikidataId?.trim())
        .filter((id): id is string => Boolean(id))
    )
    if (wikidataIds.size < 2) continue

    result.push({
      reason: 'wikidata_conflict',
      key: group.key,
      companies: group.companies.toSorted((a, b) =>
        a.name.localeCompare(b.name)
      ),
    })
  }

  return result.toSorted((a, b) => b.companies.length - a.companies.length)
}

export function findDuplicateCompanyGroups(input: {
  companies: CompanyDuplicateRow[]
  identifiers?: IdentifierRow[]
  minGroupSize?: number
}): DuplicateCompanyReport {
  const minGroupSize = input.minGroupSize ?? 2
  const identifiers = input.identifiers ?? []

  const nameGroups = findNormalizedNameGroups(input.companies, minGroupSize)
  const leiGroups = findLeiGroups(input.companies, identifiers, minGroupSize)
  const wikidataConflictGroups = findWikidataConflictGroups(nameGroups)

  const groups = [...nameGroups, ...leiGroups, ...wikidataConflictGroups]

  const companiesInGroups = new Set(
    groups.flatMap((group) => group.companies.map((company) => company.id))
  )

  const byReason: Record<DuplicateDetectionReason, number> = {
    normalized_name: nameGroups.length,
    lei: leiGroups.length,
    wikidata_conflict: wikidataConflictGroups.length,
  }

  return {
    totalCompanies: input.companies.length,
    groupCount: groups.length,
    companiesInGroups: companiesInGroups.size,
    byReason,
    groups,
  }
}
