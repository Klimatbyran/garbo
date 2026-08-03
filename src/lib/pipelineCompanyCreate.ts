import { apiFetch } from './api'
import { normalizeCompanyNameForMatch } from './companyLinkResolve'
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
  const created = await apiFetch('/companies/', {
    body: { name: companyName },
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
  const normalized = normalizeCompanyNameForMatch(companyName)

  return withNormalizedCompanyNameLock(normalized, async () => {
    const outcome = await resolvePipelineCompanyOutcome(jobData, companyName)

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

    const companyId = await createPipelineCompanyByName(companyName)
    return {
      status: 'resolved',
      companyId,
      method: 'created',
    }
  })
}
