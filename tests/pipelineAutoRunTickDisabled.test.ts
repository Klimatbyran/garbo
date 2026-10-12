import { jest } from '@jest/globals'

const prismaMock = {
  pipelineAutoRunConfig: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
  },
  reportRun: {
    count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
    findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
  },
  report: {
    count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
    findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
  },
}

const tryWithLock = jest.fn()
const reconcileSchedule = jest.fn<() => Promise<void>>()
const clearTicks = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('../src/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.unstable_mockModule('../src/lib/pipelineAutoRunLock', () => ({
  tryWithPipelineAutoRunTickLock: tryWithLock,
}))

jest.unstable_mockModule('../src/lib/pipelineAutoRunSchedule', () => ({
  reconcilePipelineAutoRunSchedule: reconcileSchedule,
  clearPipelineAutoRunRepeatableTicks: clearTicks,
}))

jest.unstable_mockModule('../src/config/redis', () => ({
  default: { host: 'localhost', port: 6379 },
}))
jest.unstable_mockModule('../src/config/docling', () => ({
  default: { baseUrl: '' },
}))
jest.unstable_mockModule('../src/queues', () => ({
  queues: {},
}))
jest.unstable_mockModule('bullmq', () => ({
  Queue: class {
    async getJobs() {
      return []
    }
    async close() {}
  },
  Job: class {},
}))

const { runPipelineAutoRunTick, patchPipelineAutoRunConfig } = await import(
  '../src/api/services/pipelineAutoRunService'
)

function configRow(overrides: Record<string, unknown> = {}) {
  return {
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
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

describe('pipeline auto-run schedule when disabled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    reconcileSchedule.mockResolvedValue(undefined)
    clearTicks.mockResolvedValue(undefined)
    prismaMock.reportRun.count.mockResolvedValue(0)
    prismaMock.reportRun.findMany.mockResolvedValue([])
    prismaMock.report.count.mockResolvedValue(0)
    prismaMock.report.findMany.mockResolvedValue([])
  })

  it('runPipelineAutoRunTick returns disabled without Redis lock and clears stray ticks', async () => {
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValue(configRow())

    const result = await runPipelineAutoRunTick()

    expect(result).toEqual({ enqueued: 0, skippedReason: 'disabled' })
    expect(tryWithLock).not.toHaveBeenCalled()
    expect(clearTicks).toHaveBeenCalledTimes(1)
    expect(reconcileSchedule).not.toHaveBeenCalled()
  })

  it('PATCH enable reconciles schedule and advances outcomeObservedThrough', async () => {
    const enabledRow = configRow({ enabled: true })
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValue(enabledRow)
    // First read inside patch is disabled → enabling
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValueOnce(
      configRow({ enabled: false })
    )
    prismaMock.pipelineAutoRunConfig.update.mockResolvedValue(enabledRow)

    const status = await patchPipelineAutoRunConfig({ enabled: true }, 'tester')

    expect(status.enabled).toBe(true)
    expect(prismaMock.pipelineAutoRunConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          enabled: true,
          consecutiveDoclingFailures: 0,
          consecutiveReportFailures: 0,
          outcomeObservedThrough: expect.any(Date),
        }),
      })
    )
    expect(reconcileSchedule).toHaveBeenCalledTimes(1)
  })

  it('PATCH disable reconciles schedule without advancing watermark', async () => {
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValue(
      configRow({ enabled: false })
    )
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValueOnce(
      configRow({ enabled: true })
    )
    prismaMock.pipelineAutoRunConfig.update.mockResolvedValue(
      configRow({ enabled: false })
    )

    await patchPipelineAutoRunConfig({ enabled: false }, 'tester')

    expect(prismaMock.pipelineAutoRunConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          enabled: false,
        }),
      })
    )
    const updateArg = (
      prismaMock.pipelineAutoRunConfig.update.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[0][0]
    expect(updateArg.data).not.toHaveProperty('outcomeObservedThrough')
    expect(reconcileSchedule).toHaveBeenCalledTimes(1)
  })

  it('PATCH without enabled does not reconcile schedule', async () => {
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValue(
      configRow({ enabled: true })
    )
    prismaMock.pipelineAutoRunConfig.update.mockResolvedValue(
      configRow({ enabled: true, maxConcurrent: 2 })
    )

    await patchPipelineAutoRunConfig({ maxConcurrent: 2 }, 'tester')

    expect(reconcileSchedule).not.toHaveBeenCalled()
  })

  it('reconcile rejection does not prevent the config write', async () => {
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValue(
      configRow({ enabled: true })
    )
    prismaMock.pipelineAutoRunConfig.findUnique.mockResolvedValueOnce(
      configRow({ enabled: false })
    )
    prismaMock.pipelineAutoRunConfig.update.mockResolvedValue(
      configRow({ enabled: true })
    )
    reconcileSchedule.mockRejectedValue(new Error('redis down'))

    const status = await patchPipelineAutoRunConfig({ enabled: true }, 'tester')

    expect(status.enabled).toBe(true)
    expect(prismaMock.pipelineAutoRunConfig.update).toHaveBeenCalled()
    expect(reconcileSchedule).toHaveBeenCalled()
  })
})
