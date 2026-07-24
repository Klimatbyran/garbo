import type { Prisma } from '@prisma/client'

const PAGE_MARKER_PATTERN = /<!-- PAGE: (\d+) -->/

export const SOURCE_REFERENCE_PROMPT = `When the context includes \`<!-- PAGE: N -->\` markers, set sourceReference on each chosen emission value you report (e.g. "p. 42", "p. 42, GHG table", "p. 42–43"). Use the page marker nearest above the quoted data. If no page marker is available, use a short human-readable locator from the nearest table or section title instead. Optionally set pageNumber to the numeric page when known.`

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

export function pageNumberFromMarkdownContext(
  markdown: string,
  sourceReference?: string
): number | undefined {
  const explicit = sourceReference?.match(/p\.?\s*(\d+)/i)?.[1]
  if (explicit) return Number.parseInt(explicit, 10)

  const markers = [...markdown.matchAll(new RegExp(PAGE_MARKER_PATTERN, 'g'))]
  if (markers.length === 0) return undefined
  const last = markers[markers.length - 1]?.[1]
  return last ? Number.parseInt(last, 10) : undefined
}
