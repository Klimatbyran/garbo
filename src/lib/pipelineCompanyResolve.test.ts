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
let findCompanyByWikidataId: typeof import('./pipelineCompanyResolve').findCompanyByWikidataId
let findCompanyByLei: typeof import('./pipelineCompanyResolve').findCompanyByLei

beforeAll(async () => {
  ;({
    resolveOrCreatePipelineCompanyId,
    resolvePipelineCompanyOutcome,
    findCompanyByWikidataId,
    findCompanyByLei,
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
        return { id: 'from-wikidata', name: 'Acme', wikidataId: 'Q123' }
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await resolveOrCreatePipelineCompanyId(
      { wikidata: { node: 'Q123' } },
      'Acme AB'
    )
    expect(result).toEqual({ companyId: 'from-wikidata', method: 'wikidata' })
  })

  it('resolves by lei before name search', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (
        typeof path === 'string' &&
        path.includes('/pipeline/companies/5493001KJTIIGC8Y1R12')
      ) {
        return {
          id: 'from-lei',
          name: 'Acme',
          lei: '5493001KJTIIGC8Y1R12',
        }
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await resolveOrCreatePipelineCompanyId(
      { lei: '5493001KJTIIGC8Y1R12' },
      'Acme AB'
    )
    expect(result).toEqual({ companyId: 'from-lei', method: 'lei' })
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
      lei: null,
    })
  })

  it('finds the company that already owns an lei', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (path === '/pipeline/companies/5493001KJTIIGC8Y1R12') {
        return {
          id: 'existing-lei',
          name: 'Acme',
          lei: '5493001KJTIIGC8Y1R12',
        }
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await findCompanyByLei('5493001KJTIIGC8Y1R12')
    expect(result).toEqual({
      id: 'existing-lei',
      name: 'Acme',
      wikidataId: null,
      lei: '5493001KJTIIGC8Y1R12',
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

  it('returns ambiguous when a single fuzzy hit does not exactly match', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (
        typeof path === 'string' &&
        path.includes('/pipeline/companies/search')
      ) {
        return [{ id: 'alfa-1', name: 'Alfa Laval', wikidataId: 'Q686030' }]
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await resolvePipelineCompanyOutcome(
      {},
      'Totally Different Name'
    )
    expect(result).toEqual({
      status: 'ambiguous',
      extractedName: 'Totally Different Name',
      candidates: [{ id: 'alfa-1', name: 'Alfa Laval', wikidataId: 'Q686030' }],
    })
  })
})
