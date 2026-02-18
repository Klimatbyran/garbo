import { z } from 'zod'
import { schema as scope1Schema } from '@garbo/jobs/scope1/schema'
import { schema as scope2Schema } from '@garbo/jobs/scope2/schema'

type Scope1Result = z.infer<typeof scope1Schema>
type Scope2Result = z.infer<typeof scope2Schema>
type Scope1Entry = Scope1Result['scope1'][number]
type Scope2Entry = Scope2Result['scope2'][number]

export type ScopeEntry = {
  year?: number
  scope1?: Scope1Entry['scope1']
  scope2?: Scope2Entry['scope2']
  scope1And2?: Scope1Entry['scope1And2'] | Scope2Entry['scope1And2']
  absoluteMostRecentYearInReport?: number
}

export function extractScopeEntriesFromFollowUp(raw: unknown): ScopeEntry[] | undefined {
  if (!raw) return undefined

  // If it's already an array of entries, just return it
  if (Array.isArray(raw)) {
    return raw as ScopeEntry[]
  }

  let parsed: any = raw

  // Handle JSON string returned from FollowUpWorker
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return undefined
    }
  }

  // If we have a { value, metadata } wrapper, unwrap it
  const container = parsed && typeof parsed === 'object' && 'value' in parsed
    ? (parsed as { value: any }).value
    : parsed

  if (!container || typeof container !== 'object') {
    return undefined
  }

  const maybeScope12 =
    (container as any).scope12 ??
    (container as any).scope1 ??
    (container as any).scope2 ??
    container

  if (!Array.isArray(maybeScope12)) {
    return undefined
  }

  return maybeScope12 as ScopeEntry[]
}

export function mergeScope1AndScope2Results(
  scope1: ScopeEntry[] | undefined,
  scope2: ScopeEntry[] | undefined,
  legacyScope12: ScopeEntry[] | undefined,
): ScopeEntry[] | undefined {
  if (legacyScope12 && !scope1 && !scope2) {
    return legacyScope12
  }

  const scope1ByYear = indexEntriesByYear(scope1)
  const scope2ByYear = indexEntriesByYear(scope2)
  const years = collectAllYears(scope1ByYear, scope2ByYear, legacyScope12)

  if (years.size === 0) {
    return legacyScope12
  }

  return Array.from(years).map((year) =>
    mergeEntriesForYear(year, scope1ByYear, scope2ByYear, legacyScope12),
  )
}

function indexEntriesByYear(entries?: ScopeEntry[]): Map<number, ScopeEntry> {
  const map = new Map<number, ScopeEntry>()
  if (!entries) return map

  for (const entry of entries) {
    if (typeof entry?.year !== 'number') continue
    map.set(entry.year, entry)
  }

  return map
}

function collectAllYears(
  scope1ByYear: Map<number, ScopeEntry>,
  scope2ByYear: Map<number, ScopeEntry>,
  legacyScope12?: ScopeEntry[],
): Set<number> {
  const legacyYears =
    legacyScope12
      ?.map((entry) => entry.year)
      .filter((year): year is number => typeof year === 'number') ?? []

  return new Set<number>([
    ...scope1ByYear.keys(),
    ...scope2ByYear.keys(),
    ...legacyYears,
  ])
}

function mergeEntriesForYear(
  year: number,
  scope1ByYear: Map<number, ScopeEntry>,
  scope2ByYear: Map<number, ScopeEntry>,
  legacyScope12?: ScopeEntry[],
): ScopeEntry {
  const scope1Entry = scope1ByYear.get(year)
  const scope2Entry = scope2ByYear.get(year)
  const legacyEntry = findLegacyEntryForYear(year, legacyScope12)

  const combined: ScopeEntry = {
    year,
    absoluteMostRecentYearInReport: pickAbsoluteMostRecentYear(
      scope1Entry,
      scope2Entry,
      legacyEntry,
    ),
  }

  combined.scope1 = scope1Entry?.scope1 ?? legacyEntry?.scope1
  combined.scope2 = scope2Entry?.scope2 ?? legacyEntry?.scope2
  combined.scope1And2 = pickScope1And2(scope1Entry, scope2Entry, legacyEntry)

  return combined
}

function findLegacyEntryForYear(
  year: number,
  legacyScope12?: ScopeEntry[],
): ScopeEntry | undefined {
  if (!legacyScope12) return undefined
  return legacyScope12.find((entry) => entry?.year === year)
}

function pickAbsoluteMostRecentYear(
  scope1Entry?: ScopeEntry,
  scope2Entry?: ScopeEntry,
  legacyEntry?: ScopeEntry,
): number | undefined {
  return (
    scope1Entry?.absoluteMostRecentYearInReport ??
    scope2Entry?.absoluteMostRecentYearInReport ??
    legacyEntry?.absoluteMostRecentYearInReport
  )
}

function pickScope1And2(
  scope1Entry?: ScopeEntry,
  scope2Entry?: ScopeEntry,
  legacyEntry?: ScopeEntry,
): ScopeEntry['scope1And2'] {
  // Prefer scope1 worker's scope1And2 value when both scope1 and scope2 workers
  // provide conflicting values. This is an explicit choice to prioritize scope1
  // worker results for combined scope1+2 emissions data.
  if (scope1Entry?.scope1And2 !== undefined) return scope1Entry.scope1And2
  if (scope2Entry?.scope1And2 !== undefined) return scope2Entry.scope1And2
  return legacyEntry?.scope1And2
}
