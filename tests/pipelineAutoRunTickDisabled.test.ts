import { jest } from '@jest/globals'

const prismaMock = {
  pipelineAutoRunConfig: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
  },
}

const tryWithLock = jest.fn()
const syncSchedule = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('../src/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.unstable_mockModule('../src/lib/pipelineAutoRunLock', () => ({
  tryWithPipelineAutoRunTickLock: tryWithLock,
}))

jest.unstable_mockModule('../src/lib/pipelineAutoRunSchedule', () => ({
  syncPipelineAutoRunSchedule: syncSchedule,
}))

// Heavy imports pulled by the service module — unused for the disabled path.
jest.unstable_mockModule('../src/config/redis', () => ({
  default: {},
}))
jest.unstable_mockModule('../src/config/docling', () => ({
  default: { baseUrls: [] },
}))
jest.unstable_mockModule('../src/queues', () => ({
  queues: {},
}))

const { runPipelineAutoRunTick } = await import(
  '../src/api/services/pipelineAutoRunService'
)

describe('runPipelineAutoRunTick when disabled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns disabled without touching the Redis tick lock', async () => {
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValue({
      id: 'default',
      enabled: false,
      maxConcurrent: 1,
      filters: {},
      runOptions: {},
      consecutiveDoclingFailures: 0,
      consecutiveReportFailures: 0,
      pausedReason: null,
      disabledReason: null,
      lastTickAt: null,
      lastEnqueuedAt: null,
      outcomeObservedThrough: null,
      lastError: null,
      updatedBy: null,
      updatedAt: new Date(),
    })

    const result = await runPipelineAutoRunTick()

    expect(result).toEqual({ enqueued: 0, skippedReason: 'disabled' })
    expect(tryWithLock).not.toHaveBeenCalled()
    expect(prismaMock.pipelineAutoRunConfig.update).not.toHaveBeenCalled()
  })
})
