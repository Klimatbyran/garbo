import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
} from '@jest/globals'

const mockApiFetch = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockWithLock = jest.fn(
  async (_normalized: string, fn: () => Promise<unknown>) => fn()
)

jest.unstable_mockModule('./api', () => ({
  apiFetch: mockApiFetch,
}))

jest.unstable_mockModule('./pipelineCompanyAdvisoryLock', () => ({
  withNormalizedCompanyNameLock: mockWithLock,
}))

let findOrCreatePipelineCompanyLocked: typeof import('./pipelineCompanyCreate').findOrCreatePipelineCompanyLocked

beforeAll(async () => {
  ;({ findOrCreatePipelineCompanyLocked } = await import(
    './pipelineCompanyCreate'
  ))
})

describe('findOrCreatePipelineCompanyLocked', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
    mockWithLock.mockClear()
  })

  it('reuses an existing company found inside the advisory lock', async () => {
    mockApiFetch.mockImplementation(async (path: unknown) => {
      if (
        typeof path === 'string' &&
        path.includes('/pipeline/companies/search')
      ) {
        return [{ id: 'existing-meta', name: 'Meta Platforms, Inc.' }]
      }
      throw new Error(`unexpected path ${String(path)}`)
    })

    const result = await findOrCreatePipelineCompanyLocked(
      {},
      'Meta Platforms, Inc.'
    )

    expect(result).toEqual({
      status: 'resolved',
      companyId: 'existing-meta',
      method: 'exact_name',
    })
    expect(mockWithLock).toHaveBeenCalledTimes(1)
    expect(mockApiFetch).not.toHaveBeenCalledWith(
      '/companies/',
      expect.anything()
    )
  })

  it('creates only when no match exists inside the lock', async () => {
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

    const result = await findOrCreatePipelineCompanyLocked({}, 'Brand New Co')

    expect(result).toEqual({
      status: 'resolved',
      companyId: 'new-company',
      method: 'created',
    })
  })
})
