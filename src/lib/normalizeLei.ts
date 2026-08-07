const LEI_PATTERN = /^[A-Z0-9]{20}$/

/** ISO 17442 mod-97-10 checksum (LEI check characters 19–20). */
export function isValidLeiChecksum(lei: string): boolean {
  let m = 0
  for (let i = 0; i < lei.length; i++) {
    const c = lei.charCodeAt(i)
    if (c >= 48 && c <= 57) {
      m = (m * 10 + c - 48) % 97
    } else if (c >= 65 && c <= 90) {
      m = (m * 100 + c - 55) % 97
    } else {
      return false
    }
  }
  return m === 1
}

export function isLeiFormat(value: string): boolean {
  return LEI_PATTERN.test(value.trim().toUpperCase())
}

/** True when value is a 20-char LEI with a valid mod-97 checksum. */
export function isValidLei(value: string): boolean {
  const normalized = value.trim().toUpperCase()
  if (!LEI_PATTERN.test(normalized)) return false
  return isValidLeiChecksum(normalized)
}

/** Normalize a Legal Entity Identifier to uppercase 20-char form, or null if invalid. */
export function normalizeLei(value: string | undefined | null): string | null {
  const trimmed = value?.trim().toUpperCase()
  if (!trimmed || !isValidLei(trimmed)) return null
  return trimmed
}

/** Merge LEI from a pipeline child job with any LEI already on the parent job. */
export function resolvePipelineLei(
  childLei: unknown,
  jobLei?: string | null
): {
  mergedLei: string | null
  ignoredInvalidChildLei?: string
} {
  const extractedLei = normalizeLei(
    typeof childLei === 'string' || childLei === null ? childLei : undefined
  )
  const mergedLei = extractedLei ?? normalizeLei(jobLei) ?? null
  const ignoredInvalidChildLei =
    typeof childLei === 'string' && childLei.trim() && !extractedLei
      ? childLei.trim()
      : undefined
  return { mergedLei, ignoredInvalidChildLei }
}
