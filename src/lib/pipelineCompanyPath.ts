/** Staff API path for pipeline workers (internal id, not wikidata Q-id). */
export function companyMutationPath(
  companyId: string,
  subPath?: string
): string {
  const base = `/companies/${companyId}`
  return subPath?.trim() ? `${base}/${subPath.trim()}` : base
}

export function pipelineCompanyReadPath(companyId: string): string {
  return `/pipeline/companies/${companyId}`
}
