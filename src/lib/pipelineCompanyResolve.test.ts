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
let resolvePipelineCompanyOutcome: typeof import('./pipelineCompanyResolve').resolvePipelineCompanyOutcome
let resolveTargetCompanyIdForWikidata: typeof import('./pipelineCompanyResolve').resolveTargetCompanyIdForWikidata
let findCompanyByWikidataId: typeof import('./pipelineCompanyResolve').findCompanyByWikidataId

beforeAll(async () => {
  ;({
    resolveOrCreatePipelineCompanyId,
    resolvePipelineCompanyOutcome,
    resolveTargetCompanyIdForWikidata,
    findCompanyByWikidataId,
  } = await import('./pipelineCompanyResolve'))
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

  it('matches names ignoring legal entity suffixes', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (
        typeof path === 'string' &&
        path.includes('/pipeline/companies/search')
      ) {
        if (path.includes('Alfa%20Laval%20AB')) {
          return [{ id: 'alfa', name: 'Alfa Laval', wikidataId: 'Q686030' }]
        }
        throw new Error(`unexpected search path ${path}`)
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await resolveOrCreatePipelineCompanyId({}, 'Alfa Laval AB')
    expect(result).toEqual({ companyId: 'alfa', method: 'exact_name' })
  })

  it('finds the company that already owns a wikidata id', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (path === '/pipeline/companies/Q686030') {
        return {
          id: 'existing-alfa',
          name: 'Alfa Laval',
          wikidataId: 'Q686030',
        }
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await findCompanyByWikidataId('Q686030')
    expect(result).toEqual({
      id: 'existing-alfa',
      name: 'Alfa Laval',
      wikidataId: 'Q686030',
    })

    const relink = await resolveTargetCompanyIdForWikidata(
      'duplicate-id',
      'Q686030'
    )
    expect(relink).toEqual({
      companyId: 'existing-alfa',
      relinked: true,
    })
  })

  it('keeps the current company when wikidata is not assigned elsewhere', async () => {
    mockApiFetch.mockImplementation(async () => null)

    const result = await resolveTargetCompanyIdForWikidata(
      'current-id',
      'Q686030'
    )
    expect(result).toEqual({
      companyId: 'current-id',
      relinked: false,
    })
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

describe('resolvePipelineCompanyOutcome', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
  })

  it('returns ambiguous when multiple companies match the normalized name', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (
        typeof path === 'string' &&
        path.includes('/pipeline/companies/search')
      ) {
        return [
          { id: 'alfa-1', name: 'Alfa Laval', wikidataId: 'Q686030' },
          { id: 'alfa-2', name: 'Alfa Laval', wikidataId: 'Q686030' },
        ]
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await resolvePipelineCompanyOutcome({}, 'Alfa Laval AB')
    expect(result).toEqual({
      status: 'ambiguous',
      extractedName: 'Alfa Laval AB',
      candidates: [
        { id: 'alfa-1', name: 'Alfa Laval', wikidataId: 'Q686030' },
        { id: 'alfa-2', name: 'Alfa Laval', wikidataId: 'Q686030' },
      ],
    })
  })
})
