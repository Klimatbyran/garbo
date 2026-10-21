import { normalizeIsin } from './normalizeIsin'
import { normalizeBic } from './normalizeBic'

/** Pipeline auto-write cap — mega-issuers stay blank rather than dumping 100k+ rows. */
export const MAX_AUTO_ISINS = 100

export type ExistingIdentifier = {
  type: string
  value: string
  role?: string | null
}

export type IdentifierWriteItem = {
  type: 'ISIN' | 'BIC' | 'ORG_NUMBER'
  value: string
  role?: 'PRIMARY'
}

export type GleifWritePlan = {
  items: IdentifierWriteItem[]
  reasons: string[]
}

function hasType(
  existing: ExistingIdentifier[],
  type: string
): boolean {
  return existing.some((row) => row.type === type)
}

function hasValue(
  existing: ExistingIdentifier[],
  type: string
  ,
  value: string
): boolean {
  return existing.some(
    (row) =>
      row.type === type && row.value.trim().toUpperCase() === value.toUpperCase()
  )
}

function hasPrimary(existing: ExistingIdentifier[], type: string): boolean {
  return existing.some((row) => row.type === type && row.role === 'PRIMARY')
}

/**
 * Build additive identifier writes from GLEIF-linked data.
 * Blank / skip when unclear; never overwrite existing ORG_NUMBER or PRIMARY.
 */
export function planGleifIdentifierWrites(input: {
  existing: ExistingIdentifier[]
  isins: string[]
  isinTotal: number
  isinsTruncated: boolean
  registeredAs?: string | null
  bics: string[]
  maxIsins?: number
}): GleifWritePlan {
  const maxIsins = input.maxIsins ?? MAX_AUTO_ISINS
  const items: IdentifierWriteItem[] = []
  const reasons: string[] = []
  const existing = input.existing

  // --- ISIN ---
  const validIsins = [
    ...new Set(
      input.isins
        .map((value) => normalizeIsin(value))
        .filter((value): value is string => Boolean(value))
    ),
  ]
  const effectiveTotal = Math.max(input.isinTotal, validIsins.length)

  if (effectiveTotal === 0) {
    reasons.push('No valid ISINs from GLEIF; leaving ISIN blank.')
  } else if (input.isinsTruncated || effectiveTotal > maxIsins) {
    reasons.push(
      `GLEIF reports ${effectiveTotal} ISINs (truncated=${input.isinsTruncated}); over auto-write cap ${maxIsins} — leaving ISIN blank.`
    )
  } else {
    const setPrimary =
      validIsins.length === 1 && !hasPrimary(existing, 'ISIN')
    for (const isin of validIsins) {
      if (hasValue(existing, 'ISIN', isin)) {
        reasons.push(`ISIN ${isin} already on company; skip.`)
        continue
      }
      items.push({
        type: 'ISIN',
        value: isin,
        ...(setPrimary ? { role: 'PRIMARY' as const } : {}),
      })
    }
    if (validIsins.length > 1) {
      reasons.push(
        `Storing ${validIsins.length} ISINs without PRIMARY (staff/clients choose).`
      )
    } else if (setPrimary) {
      reasons.push(`Storing single ISIN ${validIsins[0]} as PRIMARY.`)
    }
  }

  // --- ORG_NUMBER ---
  const org = input.registeredAs?.trim() || ''
  if (!org) {
    reasons.push('No registeredAs on GLEIF LEI record; leaving ORG_NUMBER blank.')
  } else if (hasType(existing, 'ORG_NUMBER')) {
    reasons.push('ORG_NUMBER already set; not overwriting.')
  } else {
    items.push({ type: 'ORG_NUMBER', value: org })
    reasons.push(`Storing ORG_NUMBER from registeredAs: ${org}.`)
  }

  // --- BIC ---
  const validBics = [
    ...new Set(
      input.bics
        .map((value) => normalizeBic(value))
        .filter((value): value is string => Boolean(value))
    ),
  ]
  if (validBics.length === 0) {
    reasons.push('No valid BICs from GLEIF; leaving BIC blank.')
  } else {
    const setPrimaryBic =
      validBics.length === 1 && !hasPrimary(existing, 'BIC')
    for (const bic of validBics) {
      if (hasValue(existing, 'BIC', bic)) {
        reasons.push(`BIC ${bic} already on company; skip.`)
        continue
      }
      items.push({
        type: 'BIC',
        value: bic,
        ...(setPrimaryBic ? { role: 'PRIMARY' as const } : {}),
      })
    }
    if (validBics.length > 1) {
      reasons.push(`Storing ${validBics.length} BICs without PRIMARY.`)
    }
  }

  return { items, reasons }
}
