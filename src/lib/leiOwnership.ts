import { normalizeLei } from './normalizeLei'

export type LeiWriteDecision =
  | { action: 'write'; reason: string }
  | { action: 'skip'; reason: string }

/**
 * Decide whether to write an LEI onto a company during pipeline diffLEI.
 * Does not auto-overwrite a different existing LEI, and never dual-assigns
 * when another company already owns the LEI (caller should re-resolve instead).
 */
export function decideLeiWrite(input: {
  companyId: string
  existingLei?: string | null
  incomingLei?: string | null
  /** Company id that already owns incomingLei, if any. */
  incomingLeiOwnerCompanyId?: string | null
}): LeiWriteDecision {
  const incoming = normalizeLei(input.incomingLei)
  if (!incoming) {
    return {
      action: 'skip',
      reason: 'Incoming LEI is missing or invalid; nothing to write.',
    }
  }

  const existing = normalizeLei(input.existingLei)
  if (existing && existing === incoming) {
    return {
      action: 'skip',
      reason: `Current LEI '${existing}' is already correct. No changes needed.`,
    }
  }

  if (existing && existing !== incoming) {
    return {
      action: 'skip',
      reason: `Current LEI '${existing}' differs from new LEI '${incoming}'. Keeping the existing LEI (no auto-overwrite).`,
    }
  }

  const ownerId = input.incomingLeiOwnerCompanyId?.trim()
  if (ownerId && ownerId !== input.companyId.trim()) {
    return {
      action: 'skip',
      reason: `LEI '${incoming}' already belongs to company ${ownerId}; not writing onto ${input.companyId}. Re-resolve the pipeline company instead.`,
    }
  }

  return {
    action: 'write',
    reason: `No existing LEI. New LEI '${incoming}' will be set.`,
  }
}
