export type ScopeEntry = {
  year?: number
  scope1?: any
  scope2?: any
  scope1And2?: any
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

  combined.scope1 = pickScopeField('scope1', scope1Entry, legacyEntry)
  combined.scope2 = pickScopeField('scope2', scope2Entry, legacyEntry)
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

function pickScopeField(
  field: 'scope1' | 'scope2',
  primaryEntry?: ScopeEntry,
  legacyEntry?: ScopeEntry,
): any | undefined {
  const primaryValue = primaryEntry && primaryEntry[field]
  if (primaryValue !== undefined) return primaryValue

  const legacyValue = legacyEntry && legacyEntry[field]
  return legacyValue !== undefined ? legacyValue : undefined
}

function pickScope1And2(
  scope1Entry?: ScopeEntry,
  scope2Entry?: ScopeEntry,
  legacyEntry?: ScopeEntry,
): any | undefined {
  if (scope1Entry?.scope1And2 !== undefined) return scope1Entry.scope1And2
  if (scope2Entry?.scope1And2 !== undefined) return scope2Entry.scope1And2
  return legacyEntry?.scope1And2
}
