import { companyService } from '../api/services/companyService'

/**
 * Best-effort: after a company is confirmed for a report run, remember the
 * extracted report name as an alternative name for future search/proposals.
 * Never auto-links; never changes canonical `name`. Failures are logged only.
 */
export async function collectAlternativeNameAfterConfirmedLink(input: {
  companyId: string
  extractedName: string
  log?: (message: string) => void
}): Promise<void> {
  const companyId = input.companyId.trim()
  const extractedName = input.extractedName.trim()
  if (!companyId || !extractedName) return

  try {
    const merged = await companyService.collectAlternativeNameFromResolvedLink(
      companyId,
      extractedName
    )
    if (merged) {
      input.log?.(
        `Collected alternative name "${extractedName}" for company ${companyId}`
      )
    }
  } catch (error) {
    input.log?.(
      `Failed to collect alternative name for company ${companyId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}
