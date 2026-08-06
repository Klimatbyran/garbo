import {
  companyMutationPath,
  pipelineCompanyReadPath,
} from '../src/lib/pipelineCompanyPath'

describe('pipelineCompanyPath', () => {
  const companyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  it('builds staff mutation paths by internal id', () => {
    expect(companyMutationPath(companyId)).toBe(`/companies/${companyId}`)
    expect(companyMutationPath(companyId, 'reporting-periods')).toBe(
      `/companies/${companyId}/reporting-periods`
    )
    expect(companyMutationPath(companyId, 'tags')).toBe(
      `/companies/${companyId}/tags`
    )
  })

  it('builds pipeline read path', () => {
    expect(pipelineCompanyReadPath(companyId)).toBe(
      `/pipeline/companies/${companyId}`
    )
    expect(pipelineCompanyReadPath('Q123')).toBe('/pipeline/companies/Q123')
  })
})
