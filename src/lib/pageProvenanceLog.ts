/**
 * One searchable line for page-provenance debugging across pipeline stages.
 * Grep worker logs for `pageProvenance stage=`.
 */
export function formatPageProvenanceLog(
  stage: 'parsePdf' | 'docling' | 'chroma' | 'followUp',
  fields: Record<string, string | number | boolean | null | undefined>
): string {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
  return ['pageProvenance', `stage=${stage}`, ...parts].join(' ')
}

/** Count objects in an extraction payload that already carry pageNumber. */
export function countAttachedPageNumbers(value: unknown): number {
  if (!value || typeof value !== 'object') return 0

  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countAttachedPageNumbers(item), 0)
  }

  const record = value as Record<string, unknown>
  let count = typeof record.pageNumber === 'number' ? 1 : 0
  for (const child of Object.values(record)) {
    count += countAttachedPageNumbers(child)
  }
  return count
}
