/** SWIFT BIC: 8 or 11 alphanumeric (bank/country/location[/branch]). */
const BIC_PATTERN = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/

export function isValidBic(value: string): boolean {
  return BIC_PATTERN.test(value.trim().toUpperCase())
}

/**
 * Normalize a BIC to uppercase 11-char form, or null if invalid.
 * 8-char head-office BICs are canonicalized with a trailing `XXX` branch code
 * so `TEERSESS` and `TEERSESSXXX` do not create duplicate rows.
 */
export function normalizeBic(value: string | undefined | null): string | null {
  const trimmed = value?.trim().toUpperCase()
  if (!trimmed || !isValidBic(trimmed)) return null
  if (trimmed.length === 8) return `${trimmed}XXX`
  return trimmed
}

export function requireNormalizedBic(value: string): string {
  const normalized = normalizeBic(value)
  if (!normalized) {
    throw Object.assign(
      new Error(
        `Invalid BIC: '${value.trim()}' is not a valid 8- or 11-character SWIFT BIC`
      ),
      { code: 400 }
    )
  }
  return normalized
}
