import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
} from '@jest/globals'

const mockApiFetch = jest.fn<(...args: unknown[]) => Promise<unknown>>()

jest.unstable_mockModule('./api', () => ({
  apiFetch: mockApiFetch,
}))

let resolveOrCreatePipelineCompanyId: typeof import('./pipelineCompanyResolve').resolveOrCreatePipelineCompanyId

beforeAll(async () => {
  ;({ resolveOrCreatePipelineCompanyId } = await import(
    './pipelineCompanyResolve'
  ))
})

describe('resolveOrCreatePipelineCompanyId', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
  })

  it('returns job.data.companyId when already set', async () => {
    const result = await resolveOrCreatePipelineCompanyId(
      { companyId: 'existing-id' },
      'Acme AB'
    )
    expect(result).toEqual({ companyId: 'existing-id', method: 'job_data' })
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('resolves by wikidata before creating', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (
        typeof path === 'string' &&
        path.includes('/pipeline/companies/Q123')
      ) {
        return { id: 'from-wikidata' }
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await resolveOrCreatePipelineCompanyId(
      { wikidata: { node: 'Q123' } },
      'Acme AB'
    )
    expect(result).toEqual({ companyId: 'from-wikidata', method: 'wikidata' })
  })

  it('resolves by exact name match when a single hit matches', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (
        typeof path === 'string' &&
        path.includes('/pipeline/companies/search')
      ) {
        return [
          { id: 'other', name: 'Other Co' },
          { id: 'exact', name: 'Acme AB' },
        ]
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await resolveOrCreatePipelineCompanyId({}, 'Acme AB')
    expect(result).toEqual({ companyId: 'exact', method: 'exact_name' })
  })

  it('creates a company when no match is found', async () => {
    mockApiFetch.mockImplementation(
      async (path: unknown, init?: { body?: unknown }) => {
        if (
          typeof path === 'string' &&
          path.includes('/pipeline/companies/search')
        ) {
          return []
        }
        if (path === '/companies/' && init?.body) {
          return { id: 'new-company' }
        }
        throw new Error(`unexpected path ${String(path)}`)
      }
    )

    const result = await resolveOrCreatePipelineCompanyId({}, 'Brand New Co')
    expect(result).toEqual({ companyId: 'new-company', method: 'created' })
  })
})
