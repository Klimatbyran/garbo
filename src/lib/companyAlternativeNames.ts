import {
  companyNameHasDiacritics,
  companyNameMatchKey,
  preferRicherDiacriticCompanyName,
} from './companyLinkResolve'

export type MergeAlternativeNamesOptions = {
  canonicalName: string
  existingAlternativeNames?: readonly string[]
  incomingNames?: readonly string[]
}

function preferDisplayForm(existing: string, incoming: string): string {
  if (companyNameHasDiacritics(existing) !== companyNameHasDiacritics(incoming)) {
    return preferRicherDiacriticCompanyName(existing, incoming)
  }
  // Prefer the form with more letters when keys collide (e.g. "AB" vs "Aktiebolag" noise already stripped by key).
  const existingLetterCount = (existing.match(/\p{L}/gu) ?? []).length
  const incomingLetterCount = (incoming.match(/\p{L}/gu) ?? []).length
  if (incomingLetterCount > existingLetterCount) return incoming.trim()
  if (existingLetterCount > incomingLetterCount) return existing.trim()
  return existing.trim()
}

/**
 * Merge alternative names for storage: trim, drop empties and canonical
 * duplicates (by match key), and keep one display form per match key.
 *
 * Does not decide whether a name *should* be collected — callers gate that
 * (manual edit vs confirmed link). Distinct entities that share a brand core
 * (e.g. Volvo AB vs Volvo Cars) keep different keys and stay separate entries
 * if both are passed in for different companies.
 */
export function mergeAlternativeNames({
  canonicalName,
  existingAlternativeNames = [],
  incomingNames = [],
}: MergeAlternativeNamesOptions): string[] {
  const canonicalKey = companyNameMatchKey(canonicalName)
  const byKey = new Map<string, string>()

  for (const raw of [...existingAlternativeNames, ...incomingNames]) {
    const trimmed = raw.trim()
    if (!trimmed) continue

    const key = companyNameMatchKey(trimmed)
    if (!key) continue
    if (canonicalKey && key === canonicalKey) continue

    const existing = byKey.get(key)
    byKey.set(key, existing ? preferDisplayForm(existing, trimmed) : trimmed)
  }

  return [...byKey.values()]
}

/**
 * True when `candidateName` is only a formatting / legal-suffix variant of
 * `canonicalName` (same match key). Useful for deciding auto-collect is a
 * no-op; distinct names like "Volvo Cars" vs "Volvo AB" return false.
 */
export function isFormattingVariantOfCompanyName(
  canonicalName: string,
  candidateName: string
): boolean {
  const canonicalKey = companyNameMatchKey(canonicalName)
  const candidateKey = companyNameMatchKey(candidateName)
  return (
    canonicalKey.length > 0 &&
    candidateKey.length > 0 &&
    canonicalKey === candidateKey
  )
}
