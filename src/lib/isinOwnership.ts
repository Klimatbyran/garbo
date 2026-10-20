import { normalizeIsin } from './normalizeIsin'

export type IsinWriteDecision =
  | { action: 'write'; reason: string }
  | { action: 'skip'; reason: string }

/**
 * Decide whether to write an ISIN onto a company during pipeline diffISIN.
 * Auto-writes only when the company has no ISIN, the incoming value is valid,
 * and no other company already owns it. Never auto-overwrites.
 */
export function decideIsinWrite(input: {
  companyId: string
  existingIsin?: string | null
  incomingIsin?: string | null
  /** Company id that already owns incomingIsin, if any. */
  incomingIsinOwnerCompanyId?: string | null
}): IsinWriteDecision {
  const incoming = normalizeIsin(input.incomingIsin)
  if (!incoming) {
    return {
      action: 'skip',
      reason: 'Incoming ISIN is missing or invalid; nothing to write.',
    }
  }

  const existing = normalizeIsin(input.existingIsin)
  if (existing && existing === incoming) {
    return {
      action: 'skip',
      reason: `Current ISIN '${existing}' is already correct. No changes needed.`,
    }
  }

  if (existing && existing !== incoming) {
    return {
      action: 'skip',
      reason: `Current ISIN '${existing}' differs from new ISIN '${incoming}'. Keeping the existing ISIN (no auto-overwrite).`,
    }
  }

  const ownerId = input.incomingIsinOwnerCompanyId?.trim()
  if (ownerId && ownerId !== input.companyId.trim()) {
    return {
      action: 'skip',
      reason: `ISIN '${incoming}' already belongs to company ${ownerId}; not writing onto ${input.companyId}.`,
    }
  }

  return {
    action: 'write',
    reason: `No existing ISIN. New ISIN '${incoming}' will be set.`,
  }
}

/**
 * Pick an ISIN for auto-write only when GLEIF returns exactly one valid value.
 * Multiple securities for one LEI are left blank for staff to choose later.
 */
export function selectUniqueIsinForAutoWrite(
  candidates: string[]
): { isin: string | null; reason: string } {
  const unique = [
    ...new Set(
      candidates
        .map((value) => normalizeIsin(value))
        .filter((value): value is string => Boolean(value))
    ),
  ]

  if (unique.length === 0) {
    return {
      isin: null,
      reason: 'GLEIF returned no valid ISINs for this LEI; leaving blank.',
    }
  }

  if (unique.length > 1) {
    return {
      isin: null,
      reason: `GLEIF returned ${unique.length} ISINs (${unique.join(', ')}); leaving blank to avoid picking the wrong security.`,
    }
  }

  return {
    isin: unique[0],
    reason: `Exactly one ISIN from GLEIF: ${unique[0]}.`,
  }
}
