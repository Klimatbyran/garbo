import { apiFetch } from './api'
import { companyMutationPath } from './pipelineCompanyPath'

export type StaffCompanyLinkApprovalBody = {
  companyId?: string
  createNew?: boolean
  displayName?: string
}

export function staffApprovedDisplayName(
  body: StaffCompanyLinkApprovalBody
): string | undefined {
  const name = body.displayName?.trim()
  return name || undefined
}

/** PATCH company display name when staff sets an override during company link. */
export async function applyStaffCompanyLinkDisplayName(
  companyId: string,
  displayName: string
): Promise<string> {
  const trimmed = displayName.trim()
  if (!trimmed) {
    throw new Error('Display name override is empty')
  }
  await apiFetch(companyMutationPath(companyId), { body: { name: trimmed } })
  return trimmed
}
