import type { Prisma } from '@prisma/client'

const PAGE_MARKER_PATTERN = /<!-- PAGE: (\d+) -->/

export const SOURCE_REFERENCE_PROMPT = `When the context includes \`<!-- PAGE: N -->\` markers, set both sourceReference and pageNumber on each chosen emission value you report. sourceReference should be a short locator (e.g. "p. 42", "p. 42, GHG table", "p. 42–43"). pageNumber must be the numeric page from the nearest \`<!-- PAGE: N -->\` marker above the quoted data (use the first page if the value spans a range). If no page marker is available, set sourceReference from the nearest table or section title and omit pageNumber.`

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
  sourceReference?: string
): number | undefined {
  const explicit = sourceReference?.match(/p\.?\s*(\d+)/i)?.[1]
  if (!explicit) return undefined
  const page = Number.parseInt(explicit, 10)
  return Number.isFinite(page) && page >= 1 ? page : undefined
}

export function pageNumberFromMarkdownContext(
  markdown: string,
  sourceReference?: string
): number | undefined {
  const fromReference = pageNumberFromSourceReference(sourceReference)
  if (fromReference !== undefined) return fromReference

  const markers = [...markdown.matchAll(new RegExp(PAGE_MARKER_PATTERN, 'g'))]
  if (markers.length === 0) return undefined
  const last = markers[markers.length - 1]?.[1]
  if (!last) return undefined
  const page = Number.parseInt(last, 10)
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
    pageNumberFromSourceReference(args.sourceReference ?? undefined)

  return buildSourcePageUrl(args.storagePdfUrl, pageNumber)
}
