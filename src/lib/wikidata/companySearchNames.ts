import { SearchResult } from 'wikibase-sdk'
import { normalizeCompanyName } from './companyRegistry'

/** Trailing company legal forms often omitted from Wikidata labels (e.g. "… AB" vs "…"). */
const LEGAL_FORM_SUFFIXES = new Set([
  'ab',
  'aktiebolag',
  'ag',
  'asa',
  'bv',
  'corp',
  'corporation',
  'gmbh',
  'inc',
  'incorporated',
  'int',
  'international',
  'koncern',
  'limited',
  'llc',
  'llp',
  'lp',
  'ltd',
  'nv',
  'oy',
  'oyj',
  'plc',
  'publ',
  'sa',
  'as',
  'scandinavia',
  'company',
])

/**
 * Removes one or more trailing legal-form tokens (e.g. AB, Ltd, or "(AB)", "(publ)").
 * Returns null if nothing was removed or the remainder would be empty.
 */
export function stripLegalFormSuffixes(companyName: string): string | null {
  let s = normalizeCompanyName(companyName)
  if (!s) return null
  const original = s

  while (s.length > 0) {
    const parenMatch = s.match(/^(.+?)\s*\(([^)]+)\)\s*$/i)
    if (parenMatch) {
      const rest = parenMatch[1].trim().replace(/^\.+|\.+$/g, '')
      const innerNorm = parenMatch[2].toLowerCase().replace(/\./g, '').trim()
      if (rest && LEGAL_FORM_SUFFIXES.has(innerNorm)) {
        s = rest
        continue
      }
    }

    const match = s.match(/^(.+?)\s+([^\s]+)\.?$/i)
    if (!match) break
    const rest = match[1].trim().replace(/^\.+|\.+$/g, '')
    const lastNorm = match[2].toLowerCase().replace(/\./g, '')
    if (!LEGAL_FORM_SUFFIXES.has(lastNorm)) break
    if (!rest) break
    s = rest
  }

  return s !== original && s.length > 0 ? s : null
}

/**
 * Expands the common corporate abbreviation "Int." ("International") so
 * Wikidata search can match labels like "Millicom" that omit the short form
 * (e.g. "Millicom Int. Cellular" → no hits; "Millicom International Cellular" → Q276345).
 */
export function expandInternationalAbbreviation(companyName: string): string | null {
  const normalized = normalizeCompanyName(companyName)
  if (!/\bInt\./i.test(normalized)) return null
  const expanded = normalized
    .replace(/\bInt\.\s*/gi, 'International ')
    .replace(/\bInt\./gi, 'International ')
    .trim()
    .replace(/\s+/g, ' ')
  return expanded !== normalized ? expanded : null
}

/**
 * Many Wikidata items use a trailing “Group” while exchange listings drop it.
 * Returns null when the name already ends with “Group” or is empty.
 */
function appendGroupSuffixForSearch(companyName: string): string | null {
  const s = normalizeCompanyName(companyName)
  if (!s) return null
  if (/\bgroup$/i.test(s)) return null
  return `${s} Group`
}

function appendAbSuffixForSearch(companyName: string): string | null {
  const n = normalizeCompanyName(companyName)
  if (!n) return null
  if (nameAlreadyHasTrailingLegalSuffix(n, 'ab')) return null
  return `${n} AB`
}

/**
 * Removes a trailing “Group” token (exchange listings; not in {@link LEGAL_FORM_SUFFIXES}).
 */
function stripTrailingGroupSuffix(companyName: string): string | null {
  const s = normalizeCompanyName(companyName)
  if (!s) return null
  const match = s.match(/^(.+?)\s+group\.?$/i)
  if (!match) return null
  const rest = match[1].trim().replace(/^\.+|\.+$/g, '')
  return rest.length > 0 ? rest : null
}

/** Baltic / Nordic listing prefixes often omitted from Wikidata labels (e.g. “AB Akola Group”). */
function stripLeadingLegalPrefix(companyName: string): string | null {
  const s = normalizeCompanyName(companyName)
  const match = s.match(/^(AB|AS|APB)\s+(.+)$/i)
  if (!match) return null
  const rest = match[2].trim()
  return rest.length > 0 ? rest : null
}

/**
 * Trailing listing qualifiers Wikidata often drops (e.g. “Bactiguard Holding B” → “Bactiguard”).
 */
function stripTrailingListingQualifiers(companyName: string): string[] {
  const n = normalizeCompanyName(companyName)
  if (!n) return []
  const patterns = [
    /^(.+?)\s+holding\s+b$/i,
    /^(.+?)\s+holding$/i,
    /^(.+?)\s+sweden$/i,
    /^(.+?)\s+industri$/i,
    /^(.+?)\s+operations\s+o[üu]$/i,
    /^(.+?)\s+logistic\s+property$/i,
  ]
  const out: string[] = []
  for (const pattern of patterns) {
    const match = n.match(pattern)
    if (match?.[1]?.trim()) out.push(match[1].trim())
  }
  return out
}

/** “I.A.R Systems” → “IAR Systems”. */
function normalizeInitialsAndPunctuation(companyName: string): string | null {
  const n = normalizeCompanyName(companyName)
  const simplified = n
    .replace(/([A-Za-zÅÄÖÜÕŽ])\.\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return simplified !== n && simplified.length > 0 ? simplified : null
}

/** “XANO Industri” → “Xano Industri” (Wikidata label casing). */
function titleCaseLeadingAllCapsToken(companyName: string): string | null {
  const parts = normalizeCompanyName(companyName).split(' ')
  if (parts.length === 0) return null
  const first = parts[0]
  if (!/^[A-ZÅÄÖÜÕŽ]{2,}$/.test(first)) return null
  parts[0] = first.charAt(0) + first.slice(1).toLowerCase()
  const out = parts.join(' ')
  return out !== companyName ? out : null
}

export function looksBalticListing(text: string): boolean {
  return (
    /[žūüõėą]/i.test(text) ||
    /^(AB|AS|APB)\s/i.test(text) ||
    /\bOÜ\b/i.test(text) ||
    /\bOperations\s+OÜ\b/i.test(text)
  )
}

function pushUniqueProbe(candidates: string[], query: string | null | undefined) {
  if (!query?.trim()) return
  candidates.push(query.trim())
}

/**
 * Shorter or transformed search strings when exchange listings diverge from Wikidata labels.
 * Shortest variant first for probe priority.
 */
export function listingStripProbeQueries(companyName: string): string[] {
  const normalized = normalizeCompanyName(companyName)
  if (!normalized) return []

  const candidates: string[] = []
  const withoutAb = stripLegalFormSuffixes(companyName)
  const withoutGroup = stripTrailingGroupSuffix(companyName)
  const withoutPrefix = stripLeadingLegalPrefix(companyName)

  pushUniqueProbe(candidates, withoutAb)
  pushUniqueProbe(candidates, withoutGroup)
  pushUniqueProbe(candidates, withoutPrefix)
  for (const q of stripTrailingListingQualifiers(companyName)) {
    pushUniqueProbe(candidates, q)
  }

  if (withoutAb) {
    pushUniqueProbe(candidates, stripTrailingGroupSuffix(withoutAb))
    for (const q of stripTrailingListingQualifiers(withoutAb)) {
      pushUniqueProbe(candidates, q)
    }
  }
  if (withoutGroup) {
    pushUniqueProbe(candidates, stripLegalFormSuffixes(withoutGroup))
    for (const q of stripTrailingListingQualifiers(withoutGroup)) {
      pushUniqueProbe(candidates, q)
    }
  }
  if (withoutPrefix) {
    pushUniqueProbe(candidates, stripTrailingGroupSuffix(withoutPrefix))
    pushUniqueProbe(candidates, stripLegalFormSuffixes(withoutPrefix))
    for (const q of stripTrailingListingQualifiers(withoutPrefix)) {
      pushUniqueProbe(candidates, q)
    }
  }

  if (/\bi\s+sverige\b/i.test(normalized)) {
    pushUniqueProbe(
      candidates,
      normalized.replace(/\bi\s+sverige\b/i, 'Sverige')
    )
    pushUniqueProbe(
      candidates,
      normalized.replace(/\bi\s+sverige\b/i, 'Sverige AB')
    )
  }

  const dePunctuated = normalizeInitialsAndPunctuation(normalized)
  pushUniqueProbe(candidates, dePunctuated)
  if (dePunctuated) {
    pushUniqueProbe(candidates, stripTrailingGroupSuffix(dePunctuated))
  }

  pushUniqueProbe(candidates, titleCaseLeadingAllCapsToken(normalized))

  const derived = [...candidates]
  for (const q of derived) {
    pushUniqueProbe(candidates, titleCaseLeadingAllCapsToken(q))
    for (const shorter of stripTrailingListingQualifiers(q)) {
      pushUniqueProbe(candidates, shorter)
      pushUniqueProbe(candidates, titleCaseLeadingAllCapsToken(shorter))
    }
  }

  if (normalized.split(/\s+/).length === 1) {
    pushUniqueProbe(candidates, `Investment AB ${normalized}`)
  }

  const normKey = normalizedHitLabel(normalized)
  return [...new Set(candidates)]
    .filter((q) => normalizedHitLabel(q) !== normKey)
    .sort((a, b) => a.length - b.length)
    .slice(0, 12)
}

export function listingNameHasStripProbes(companyName: string): boolean {
  return listingStripProbeQueries(companyName).length > 0
}

export function normalizedHitLabel(label: string | undefined): string {
  return (label ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function resultsIncludeExactLabel(
  results: SearchResult[],
  expectedLabel: string
): boolean {
  const want = normalizedHitLabel(expectedLabel)
  return results.some((r) => normalizedHitLabel(r.label) === want)
}

/**
 * Exchange listings often omit “Group” / “AB” while Wikidata labels include them
 * (e.g. listing “Nelly” → item “Nelly Group”). Merge probe hits even when the plain
 * name already returns noisy results.
 */
export function listingSuffixProbeQueries(companyName: string): string[] {
  const probes: string[] = []
  const withGroup = appendGroupSuffixForSearch(companyName)
  if (withGroup) probes.push(withGroup)
  const withAb = appendAbSuffixForSearch(companyName)
  if (withAb) probes.push(withAb)
  return probes
}

/**
 * Wikidata often lists companies with a legal-form suffix ("Evolution AB", "Acme Ltd").
 * Plain-name search can miss the item entirely (e.g. "Evolution" → biology). When every
 * hit lacks a company-like P31, we probe {@link LEGAL_FORM_SUFFIXES} in order.
 */
function legalFormSuffixAppendLabel(norm: string): string {
  const lowerShort: Record<string, string> = {
    ltd: 'Ltd',
    plc: 'plc',
    corp: 'Corp',
    inc: 'Inc',
    gmbh: 'GmbH',
    group: 'Group',
    publ: '(publ)',
    int: 'Int',
  }
  if (lowerShort[norm]) return lowerShort[norm]
  if (norm.length >= 5) return norm.charAt(0).toUpperCase() + norm.slice(1)
  return norm.toUpperCase()
}

function nameAlreadyHasTrailingLegalSuffix(
  normalizedName: string,
  norm: string
): boolean {
  const paren = normalizedName.match(/^(.+?)\s*\(([^)]+)\)\s*$/i)
  if (paren) {
    const inner = paren[2].toLowerCase().replace(/\./g, '').trim()
    if (inner === norm) return true
  }
  const match = normalizedName.match(/^(.+?)\s+([^\s]+)\.?$/i)
  if (!match) return false
  const lastNorm = match[2].toLowerCase().replace(/\./g, '')
  return lastNorm === norm
}

/** Priority order: common Stockholm-list style first, then rest A–z. */
function legalFormNormsForSupplementarySearch(): string[] {
  return [...LEGAL_FORM_SUFFIXES].sort((a, b) => {
    if (a === 'ab') return -1
    if (b === 'ab') return 1
    return a.localeCompare(b)
  })
}

export function supplementaryLegalFormListingQueries(companyName: string): string[] {
  const n = normalizeCompanyName(companyName)
  if (!n) return []
  const out: string[] = []
  for (const norm of legalFormNormsForSupplementarySearch()) {
    if (nameAlreadyHasTrailingLegalSuffix(n, norm)) continue
    out.push(`${n} ${legalFormSuffixAppendLabel(norm)}`)
  }
  return out
}

