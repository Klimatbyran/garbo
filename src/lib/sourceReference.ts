import type { Prisma } from '@prisma/client'
import type { RetrievedParagraph } from './vectordb'

const scopeValueKeys = ['scope1', 'scope2', 'scope1And2'] as const

function sourceReferenceFromScopeValue(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const ref = (value as { sourceReference?: unknown }).sourceReference
  return typeof ref === 'string' && ref.trim() ? ref.trim() : undefined
}

function sourceReferenceFromYearEntry(entry: unknown): string | undefined {
  if (!entry || typeof entry !== 'object') return undefined
  const record = entry as Record<string, unknown>

  for (const key of scopeValueKeys) {
    const ref = sourceReferenceFromScopeValue(record[key])
    if (ref) return ref
  }

  const topLevel = record.sourceReference
  if (typeof topLevel === 'string' && topLevel.trim()) return topLevel.trim()

  return undefined
}

function sourceReferenceFromScope3Value(scope3: unknown): string | undefined {
  if (!scope3 || typeof scope3 !== 'object') return undefined
  const record = scope3 as {
    categories?: unknown[]
    statedTotalEmissions?: { sourceReference?: unknown }
  }

  for (const category of record.categories ?? []) {
    if (!category || typeof category !== 'object') continue
    const ref = (category as { sourceReference?: unknown }).sourceReference
    if (typeof ref === 'string' && ref.trim()) return ref.trim()
  }

  return sourceReferenceFromScopeValue(record.statedTotalEmissions)
}

/**
 * Pick the first human-readable page locator from an extraction value
 * (scope1/2/3 follow-up `value` payload).
 */
export function extractSourceReferenceFromExtractionValue(
  value: unknown
): string | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>

  for (const key of ['scope1', 'scope2', 'scope12', 'scope3'] as const) {
    const entries = record[key]
    if (!Array.isArray(entries)) continue

    for (const entry of entries) {
      const ref =
        key === 'scope3'
          ? sourceReferenceFromScope3Value(
              (entry as { scope3?: unknown })?.scope3
            )
          : sourceReferenceFromYearEntry(entry)
      if (ref) return ref
    }
  }

  return null
}

export function archiveFieldsFromFollowUpReturnValue(
  returnValue: Record<string, unknown> | null
): {
  sourceReference: string | null
  extractionResult: Prisma.InputJsonValue | undefined
} {
  if (!returnValue) {
    return { sourceReference: null, extractionResult: undefined }
  }

  const extractionValue =
    'value' in returnValue ? returnValue.value : returnValue

  return {
    sourceReference:
      extractSourceReferenceFromExtractionValue(extractionValue),
    extractionResult: returnValue as Prisma.InputJsonValue,
  }
}

export function pageNumberFromSourceReference(
  sourceReference?: string | null
): number | undefined {
  const explicit = sourceReference?.match(/p\.?\s*(\d+)/i)?.[1]
  if (!explicit) return undefined
  const page = Number.parseInt(explicit, 10)
  return Number.isFinite(page) && page >= 1 ? page : undefined
}

/**
 * Build a deep link to the internally stored report PDF at a given page.
 * Uses the PDF open-parameter fragment `#page=N` (supported by browser PDF viewers).
 */
export function buildSourcePageUrl(
  storagePdfUrl: string | null | undefined,
  pageNumber: number | null | undefined
): string | undefined {
  if (!storagePdfUrl?.trim()) return undefined
  if (
    typeof pageNumber !== 'number' ||
    !Number.isFinite(pageNumber) ||
    pageNumber < 1
  ) {
    return undefined
  }

  const base = storagePdfUrl.trim().replace(/#.*$/, '')
  return `${base}#page=${Math.floor(pageNumber)}`
}

/**
 * Resolve page number from explicit extraction field or a "p. N" locator,
 * then build the internal storage PDF deep link when possible.
 */
export function resolveSourcePageUrl(args: {
  storagePdfUrl?: string | null
  pageNumber?: number | null
  sourceReference?: string | null
  sourcePageUrl?: string | null
}): string | undefined {
  if (args.sourcePageUrl?.trim()) return args.sourcePageUrl.trim()

  const pageNumber =
    (typeof args.pageNumber === 'number' &&
    Number.isFinite(args.pageNumber) &&
    args.pageNumber >= 1
      ? Math.floor(args.pageNumber)
      : undefined) ??
    pageNumberFromSourceReference(args.sourceReference)

  return buildSourcePageUrl(args.storagePdfUrl, pageNumber)
}

function normalizeSearchText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function numberNeedles(value: number): string[] {
  const asDot = String(value)
  const asComma = asDot.replace('.', ',')
  return Array.from(new Set([asDot, asComma]))
}

function pageNumberForNeedles(
  needles: string[],
  paragraphs: RetrievedParagraph[]
): number | undefined {
  const usable = needles
    .map((needle) => normalizeSearchText(needle))
    .filter((needle) => needle.length >= 2)

  for (const paragraph of paragraphs) {
    if (paragraph.pageNumber === undefined) continue
    const haystack = normalizeSearchText(paragraph.text)
    if (usable.some((needle) => haystack.includes(needle))) {
      return paragraph.pageNumber
    }
  }
  return undefined
}

function withProvenance<T extends Record<string, unknown>>(
  value: T,
  pageNumber: number | undefined
): T {
  if (pageNumber === undefined) return value
  if (typeof value.pageNumber === 'number' || typeof value.sourceReference === 'string') {
    return value
  }
  return {
    ...value,
    pageNumber,
    sourceReference: `p. ${pageNumber}`,
  }
}

function collectEntryNeedles(entry: Record<string, unknown>): string[] {
  const needles: string[] = []

  for (const key of scopeValueKeys) {
    const scopeValue = entry[key]
    if (!scopeValue || typeof scopeValue !== 'object') continue
    const record = scopeValue as Record<string, unknown>
    for (const field of ['total', 'mb', 'lb', 'unknown'] as const) {
      if (typeof record[field] === 'number') {
        needles.push(...numberNeedles(record[field]))
      }
    }
  }

  const candidates = entry.listOfAllPossibleScope1Numbers
  if (Array.isArray(candidates)) {
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') continue
      const sourceText = (candidate as { sourceText?: unknown }).sourceText
      if (typeof sourceText === 'string' && sourceText.trim()) {
        needles.push(sourceText.trim())
      }
    }
  }

  return needles
}

function enrichYearEntry(
  entry: unknown,
  paragraphs: RetrievedParagraph[]
): unknown {
  if (!entry || typeof entry !== 'object') return entry
  const record = { ...(entry as Record<string, unknown>) }
  const pageNumber = pageNumberForNeedles(
    collectEntryNeedles(record),
    paragraphs
  )

  for (const key of scopeValueKeys) {
    const scopeValue = record[key]
    if (!scopeValue || typeof scopeValue !== 'object') continue
    record[key] = withProvenance(
      { ...(scopeValue as Record<string, unknown>) },
      pageNumber
    )
  }

  return record
}

function enrichScope3Entry(
  entry: unknown,
  paragraphs: RetrievedParagraph[]
): unknown {
  if (!entry || typeof entry !== 'object') return entry
  const record = { ...(entry as Record<string, unknown>) }
  const scope3 = record.scope3
  if (!scope3 || typeof scope3 !== 'object') return record

  const scope3Record = { ...(scope3 as Record<string, unknown>) }
  const categories = Array.isArray(scope3Record.categories)
    ? scope3Record.categories.map((category) => {
        if (!category || typeof category !== 'object') return category
        const categoryRecord = { ...(category as Record<string, unknown>) }
        const needles =
          typeof categoryRecord.total === 'number'
            ? numberNeedles(categoryRecord.total)
            : []
        return withProvenance(
          categoryRecord,
          pageNumberForNeedles(needles, paragraphs)
        )
      })
    : scope3Record.categories

  const stated = scope3Record.statedTotalEmissions
  const statedEnriched =
    stated && typeof stated === 'object'
      ? withProvenance(
          { ...(stated as Record<string, unknown>) },
          pageNumberForNeedles(
            typeof (stated as { total?: unknown }).total === 'number'
              ? numberNeedles((stated as { total: number }).total)
              : [],
            paragraphs
          )
        )
      : stated

  record.scope3 = {
    ...scope3Record,
    categories,
    statedTotalEmissions: statedEnriched,
  }
  return record
}

/**
 * Attach page provenance from Chroma-retrieved paragraph metadata.
 * Does not ask the LLM for page numbers — matches extracted values/snippets
 * against retrieved paragraphs that already carry `pageNumber`.
 */
export function attachPageProvenanceToExtraction(
  value: unknown,
  paragraphs: RetrievedParagraph[]
): unknown {
  if (!value || typeof value !== 'object' || paragraphs.length === 0) {
    return value
  }

  const record = { ...(value as Record<string, unknown>) }

  for (const key of ['scope1', 'scope2', 'scope12'] as const) {
    const entries = record[key]
    if (!Array.isArray(entries)) continue
    record[key] = entries.map((entry) => enrichYearEntry(entry, paragraphs))
  }

  if (Array.isArray(record.scope3)) {
    record.scope3 = record.scope3.map((entry) =>
      enrichScope3Entry(entry, paragraphs)
    )
  }

  return record
}
