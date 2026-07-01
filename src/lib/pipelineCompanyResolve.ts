import { apiFetch } from './api'
import { pipelineCompanyReadPath } from './pipelineCompanyPath'

type PipelineCompanyRef = {
  companyId?: string
  companyName?: string
  wikidata?: { node?: string }
}

type CompanySearchHit = { id: string; name: string }

function normalizeCompanyName(name: string): string {
  return name.trim().toLocaleLowerCase('sv-SE')
}

/**
 * Resolve the stable Garbo company id for a pipeline run.
 * Prefer explicit job data, then wikidata lookup, then exact name match, else create.
 */
export async function resolveOrCreatePipelineCompanyId(
  jobData: PipelineCompanyRef,
  companyName: string
): Promise<string> {
  if (jobData.companyId?.trim()) return jobData.companyId.trim()

  const wikidataId = jobData.wikidata?.node?.trim()
  if (wikidataId) {
    const byWikidata = await apiFetch(pipelineCompanyReadPath(wikidataId)).catch(
      () => null
    )
    if (byWikidata?.id) return byWikidata.id as string
  }

  const searchHits = (await apiFetch(
    `/pipeline/companies/search?q=${encodeURIComponent(companyName)}`
  ).catch(() => [])) as CompanySearchHit[]

  if (Array.isArray(searchHits)) {
    const target = normalizeCompanyName(companyName)
    const exactMatches = searchHits.filter(
      (hit) => hit.name && normalizeCompanyName(hit.name) === target
    )
    if (exactMatches.length === 1) return exactMatches[0].id
  }

  const created = await apiFetch('/companies/', {
    body: { name: companyName },
  })
  if (!created?.id) {
    throw new Error('Company create did not return id')
  }
  return created.id as string
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
  const company = (await apiFetch(
    pipelineCompanyReadPath(companyId)
  ).catch(() => null)) as CompanyWithIdentifiers | null
  if (!company?.identifiers?.length) return false

  const wikidataRow = company.identifiers.find((row) => row.type === 'WIKIDATA')
  return Boolean(wikidataRow?.metadata?.verifiedBy)
}
