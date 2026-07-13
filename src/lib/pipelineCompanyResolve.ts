import { apiFetch } from './api'
import {
  assessCompanyLinkResolution,
  type CompanyLinkCandidate,
  stripLegalEntitySuffixes,
} from './companyLinkResolve'
import { normalizeLei } from './normalizeLei'
import { pipelineCompanyReadPath } from './pipelineCompanyPath'

const COMPANY_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type PipelineCompanyRef = {
  companyId?: string
  companyName?: string
  wikidata?: { node?: string }
  lei?: string
}

export type CompanyResolutionMethod =
  | 'job_data'
  | 'wikidata'
  | 'lei'
  | 'exact_name'
  | 'approved_link'
  | 'created'

export type CompanyResolution = {
  companyId: string
  method: CompanyResolutionMethod
}

export type PipelineCompanyResolveOutcome =
  | { status: 'resolved'; companyId: string; method: CompanyResolutionMethod }
  | {
      status: 'ambiguous'
      extractedName: string
      candidates: CompanyLinkCandidate[]
    }
  | { status: 'create'; extractedName: string }

type PipelineCompanyRecord = {
  id?: string
  name?: string
  wikidataId?: string | null
  lei?: string | null
}

/** Resolve wikidata Q-id / LEI / UUID prefix to the internal Company.id used for mutations. */
export async function resolveInternalCompanyId(
  identifier: string
): Promise<string> {
  const trimmed = identifier.trim()
  if (!trimmed) {
    throw new Error('Empty company identifier')
  }
  if (COMPANY_UUID_RE.test(trimmed)) {
    return trimmed
  }

  const company = (await apiFetch(pipelineCompanyReadPath(trimmed)).catch(
    () => null
  )) as PipelineCompanyRecord | null

  const internalId = company?.id?.trim()
  if (!internalId) {
    throw new Error(
      `Could not resolve internal company id for identifier: ${trimmed}`
    )
  }
  return internalId
}

function toCompanyLinkCandidate(
  record: PipelineCompanyRecord
): CompanyLinkCandidate | null {
  const id = record.id?.trim()
  if (!id) return null
  return {
    id,
    name: record.name ?? '',
    wikidataId: record.wikidataId ?? null,
    lei: record.lei ?? null,
  }
}

async function searchCompaniesByName(
  companyName: string
): Promise<CompanyLinkCandidate[]> {
  const hits = (await apiFetch(
    `/pipeline/companies/search?q=${encodeURIComponent(companyName)}`
  ).catch(() => [])) as CompanyLinkCandidate[]
  return Array.isArray(hits) ? hits : []
}

async function collectNameSearchCandidates(
  companyName: string
): Promise<CompanyLinkCandidate[]> {
  const namesToTry = [companyName]
  const strippedName = stripLegalEntitySuffixes(companyName)
  if (strippedName !== companyName.trim()) {
    namesToTry.push(strippedName)
  }

  const byId = new Map<string, CompanyLinkCandidate>()
  for (const query of namesToTry) {
    for (const hit of await searchCompaniesByName(query)) {
      byId.set(hit.id, hit)
    }
  }
  return [...byId.values()]
}

async function findCompanyByIdentifier(
  identifier: string
): Promise<CompanyLinkCandidate | null> {
  const existing = (await apiFetch(pipelineCompanyReadPath(identifier)).catch(
    () => null
  )) as PipelineCompanyRecord | null

  if (!existing) return null

  return toCompanyLinkCandidate(existing)
}

/** Look up which company already owns a Wikidata Q-id in the current API. */
export async function findCompanyByWikidataId(
  wikidataId: string
): Promise<CompanyLinkCandidate | null> {
  return findCompanyByIdentifier(wikidataId)
}

/** Look up which company already owns an LEI in the current API. */
export async function findCompanyByLei(
  lei: string
): Promise<CompanyLinkCandidate | null> {
  const normalizedLei = normalizeLei(lei)
  if (!normalizedLei) return null
  return findCompanyByIdentifier(normalizedLei)
}

/**
 * Resolve the stable Garbo company id for a pipeline run without creating a company.
 * Prefers explicit job data, then Wikidata, then LEI, then exact name match.
 * Returns ambiguous when staff must pick among candidates.
 */
export async function resolvePipelineCompanyOutcome(
  jobData: PipelineCompanyRef,
  companyName: string
): Promise<PipelineCompanyResolveOutcome> {
  if (jobData.companyId?.trim()) {
    const companyId = await resolveInternalCompanyId(jobData.companyId)
    return {
      status: 'resolved',
      companyId,
      method: 'job_data',
    }
  }

  const wikidataId = jobData.wikidata?.node?.trim()
  if (wikidataId) {
    const byWikidata = await findCompanyByWikidataId(wikidataId)
    if (byWikidata?.id) {
      return {
        status: 'resolved',
        companyId: byWikidata.id,
        method: 'wikidata',
      }
    }
  }

  const normalizedLei = normalizeLei(jobData.lei)
  if (normalizedLei) {
    const byLei = await findCompanyByLei(normalizedLei)
    if (byLei?.id) {
      return {
        status: 'resolved',
        companyId: byLei.id,
        method: 'lei',
      }
    }
  }

  const candidates = await collectNameSearchCandidates(companyName)
  const assessment = assessCompanyLinkResolution(companyName, candidates)

  if (assessment.action === 'resolve') {
    return {
      status: 'resolved',
      companyId: assessment.companyId,
      method: 'exact_name',
    }
  }

  if (assessment.action === 'ambiguous') {
    return {
      status: 'ambiguous',
      extractedName: companyName,
      candidates: assessment.candidates,
    }
  }

  return { status: 'create', extractedName: companyName }
}

/**
 * Resolve the stable Garbo company id for a pipeline run.
 * Prefer explicit job data, then identifiers, then exact name match, else create.
 * Ambiguous matches fall through to create — use resolvePipelineCompanyOutcome in precheck.
 */
export async function resolveOrCreatePipelineCompanyId(
  jobData: PipelineCompanyRef,
  companyName: string
): Promise<CompanyResolution> {
  const outcome = await resolvePipelineCompanyOutcome(jobData, companyName)

  if (outcome.status === 'resolved') {
    return { companyId: outcome.companyId, method: outcome.method }
  }

  const created = await apiFetch('/companies/', {
    body: { name: companyName },
  })
  if (!created?.id) {
    throw new Error('Company create did not return id')
  }
  return { companyId: created.id as string, method: 'created' }
}

type CompanyWithIdentifiers = {
  identifiers?: Array<{
    type: string
    metadata?: { verifiedBy?: string | null } | null
  }>
}

/** True when the company has a verified WIKIDATA identifier (for Wikidata upload gating). */
export async function hasVerifiedWikidataIdentifier(
  companyId: string
): Promise<boolean> {
  const company = (await apiFetch(pipelineCompanyReadPath(companyId)).catch(
    () => null
  )) as CompanyWithIdentifiers | null
  if (!company?.identifiers?.length) return false

  const wikidataRow = company.identifiers.find((row) => row.type === 'WIKIDATA')
  return Boolean(wikidataRow?.metadata?.verifiedBy)
}
