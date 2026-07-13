const LEI_PATTERN = /^[A-Z0-9]{20}$/

/** Normalize a Legal Entity Identifier to uppercase 20-char form, or null if invalid. */
export function normalizeLei(value: string | undefined | null): string | null {
  const trimmed = value?.trim().toUpperCase()
  if (!trimmed || !LEI_PATTERN.test(trimmed)) return null
  return trimmed
}

export function isLeiFormat(value: string): boolean {
  return LEI_PATTERN.test(value.trim().toUpperCase())
}
