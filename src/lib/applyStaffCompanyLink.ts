import { apiFetch } from './api'
import { companyMutationPath } from './pipelineCompanyPath'

export type StaffCompanyLinkApprovalBody = {
  companyId?: string
  createNew?: boolean
  displayName?: string
}

export function staffApprovedDisplayName(
  body: StaffCompanyLinkApprovalBody | Record<string, unknown>
): string | undefined {
  const raw =
    'displayName' in body && typeof body.displayName === 'string'
      ? body.displayName
      : undefined
  const name = raw?.trim()
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
