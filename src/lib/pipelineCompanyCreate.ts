import { apiFetch } from './api'
import { normalizeCompanyNameForMatch } from './companyLinkResolve'
import { sanitizeExtractedCompanyName } from './companyNamePlaceholders'
import { withNormalizedCompanyNameLock } from './pipelineCompanyAdvisoryLock'
import {
  resolvePipelineCompanyOutcome,
  type CompanyResolutionMethod,
  type PipelineCompanyResolveOutcome,
} from './pipelineCompanyResolve'

type PipelineCompanyRef = {
  companyId?: string
  companyName?: string
  wikidata?: { node?: string }
  lei?: string
}

export type FindOrCreatePipelineCompanyResult =
  | {
      status: 'resolved'
      companyId: string
      method: CompanyResolutionMethod
    }
  | Extract<PipelineCompanyResolveOutcome, { status: 'ambiguous' }>

async function createPipelineCompanyByName(
  companyName: string
): Promise<string> {
  const safeName = sanitizeExtractedCompanyName(companyName)
  if (!safeName) {
    throw new Error(
      `Refusing to create company with placeholder name: ${JSON.stringify(companyName)}`
    )
  }
  const created = await apiFetch('/companies/', {
    body: { name: safeName },
  })
  if (!created?.id) {
    throw new Error('Company create did not return id')
  }
  return created.id as string
}

/**
 * Resolve an existing company or create one under a normalized-name advisory lock.
 * Re-runs resolution inside the lock so concurrent precheck jobs share one row.
 */
export async function findOrCreatePipelineCompanyLocked(
  jobData: PipelineCompanyRef,
  companyName: string
): Promise<FindOrCreatePipelineCompanyResult> {
  const safeName = sanitizeExtractedCompanyName(companyName)
  if (!safeName) {
    throw new Error(
      `Refusing to resolve/create company with placeholder name: ${JSON.stringify(companyName)}`
    )
  }

  const normalized = normalizeCompanyNameForMatch(safeName)

  const outcome = await resolvePipelineCompanyOutcome(jobData, safeName)

  if (outcome.status === 'resolved') {
    return {
      status: 'resolved',
      companyId: outcome.companyId,
      method: outcome.method,
    }
  }

  if (outcome.status === 'ambiguous') {
    return outcome
  }

  return withNormalizedCompanyNameLock(normalized, async () => {
    const lockedOutcome = await resolvePipelineCompanyOutcome(
      jobData,
      safeName
    )

    if (lockedOutcome.status === 'resolved') {
      return {
        status: 'resolved',
        companyId: lockedOutcome.companyId,
        method: lockedOutcome.method,
      }
    }

    if (lockedOutcome.status === 'ambiguous') {
      return lockedOutcome
    }

    const companyId = await createPipelineCompanyByName(safeName)
    return {
      status: 'resolved',
      companyId,
      method: 'created',
    }
  })
}
