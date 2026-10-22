const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/

/**
 * ISO 6166 ISIN check digit (mod-10 / Luhn over the alphanumeric expansion).
 * Letters A–Z map to 10–35 before the Luhn pass.
 */
export function isValidIsinChecksum(isin: string): boolean {
  const normalized = isin.trim().toUpperCase()
  if (!ISIN_PATTERN.test(normalized)) return false

  let digits = ''
  for (const char of normalized.slice(0, -1)) {
    if (char >= '0' && char <= '9') {
      digits += char
    } else {
      digits += String(char.charCodeAt(0) - 55)
    }
  }

  let sum = 0
  let doubleDigit = true
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48
    if (doubleDigit) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    doubleDigit = !doubleDigit
  }

  const check = (10 - (sum % 10)) % 10
  return check === Number(normalized[normalized.length - 1])
}

export function isIsinFormat(value: string): boolean {
  return ISIN_PATTERN.test(value.trim().toUpperCase())
}

/** True when value is a 12-char ISIN with a valid check digit. */
export function isValidIsin(value: string): boolean {
  const normalized = value.trim().toUpperCase()
  if (!ISIN_PATTERN.test(normalized)) return false
  return isValidIsinChecksum(normalized)
}

/** Normalize an ISIN to uppercase 12-char form, or null if invalid. */
export function normalizeIsin(value: string | undefined | null): string | null {
  const trimmed = value?.trim().toUpperCase()
  if (!trimmed || !isValidIsin(trimmed)) return null
  return trimmed
}

/**
 * Normalize a non-empty ISIN for persistence. Throws `{ code: 400 }` when the
 * value is present but not a valid checksum ISIN.
 */
export function requireNormalizedIsin(value: string): string {
  const normalized = normalizeIsin(value)
  if (!normalized) {
    throw Object.assign(
      new Error(
        `Invalid ISIN: '${value.trim()}' is not a valid 12-character ISIN with checksum`
      ),
      { code: 400 }
    )
  }
  return normalized
}
