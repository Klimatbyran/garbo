import { describe, it, expect, jest, beforeEach } from '@jest/globals'

const addDiff = jest.fn(async (..._args: unknown[]) => ({}))
const getGleifLinkedIdentifiers = jest.fn(
  async (..._args: unknown[]) => null as unknown
)

jest.mock('../queues', () => ({
  QUEUE_NAMES: { EXTRACT_GLEIF_IDS: 'extractGleifIds' },
  queues: {
    diffGleifIds: {
      add: (...args: unknown[]) => addDiff(...args),
    },
  },
}))

jest.mock('../lib/gleif', () => ({
  getGleifLinkedIdentifiers: (...args: unknown[]) =>
    getGleifLinkedIdentifiers(...args),
}))

jest.mock('../lib/normalizeLei', () => ({
  normalizeLei: (lei: string) => (lei?.trim() ? lei.trim().toUpperCase() : null),
}))

jest.mock('../lib/PipelineWorker', () => {
  class PipelineJob {
    data: Record<string, unknown>
    id?: string
    queueQualifiedName: string
    log = jest.fn(async () => undefined)
    sendMessage = jest.fn(async () => undefined)
    updateData = jest.fn(async (data: Record<string, unknown>) => {
      this.data = data
    })
    moveToWaitingChildren = jest.fn(async () => true)

    constructor(data: Record<string, unknown>) {
      this.data = data
      this.id = 'job-1'
      this.queueQualifiedName = 'bull:extractGleifIds'
    }
  }

  class PipelineWorker {
    processor: (
      job: PipelineJob,
      logger: unknown,
      token?: string
    ) => Promise<unknown>

    constructor(_name: string, processor: PipelineWorker['processor']) {
      this.processor = processor
    }
  }

  return { PipelineJob, PipelineWorker }
})

type WorkerWithProcessor = {
  processor: (
    job: any,
    logger: unknown,
    token?: string
  ) => Promise<unknown>
}

describe('extractGleifIds parent link', () => {
  beforeEach(() => {
    addDiff.mockReset()
    addDiff.mockResolvedValue({})
    getGleifLinkedIdentifiers.mockReset()
    jest.resetModules()
  })

  it('parents diffGleifIds with queueQualifiedName and waits for children', async () => {
    getGleifLinkedIdentifiers.mockResolvedValue({
      isins: ['SE0000108656'],
      isinTotal: 1,
      isinsTruncated: false,
      registeredAs: 'Org',
      bics: [],
      jurisdiction: 'SE',
    })

    const mod = await import('./extractGleifIds')
    const worker = mod.default as unknown as WorkerWithProcessor
    const { PipelineJob } = await import('../lib/PipelineWorker')
    const job = new (PipelineJob as any)({
      url: 'https://example.com/r.pdf',
      companyName: 'Acme',
      companyId: 'c1',
      lei: '5493001KJTIIGC8Y1R12',
      autoApprove: true,
    })

    await expect(worker.processor(job, {}, 'token-1')).rejects.toMatchObject({
      name: 'WaitingChildrenError',
    })

    expect(addDiff).toHaveBeenCalledTimes(1)
    const opts = addDiff.mock.calls[0]?.[2] as Record<string, unknown>
    expect(opts).toEqual(
      expect.objectContaining({
        parent: {
          id: 'job-1',
          queue: 'bull:extractGleifIds',
        },
        ignoreDependencyOnFailure: true,
        failParentOnFailure: false,
      })
    )
    expect(job.updateData).toHaveBeenCalledWith(
      expect.objectContaining({ gleifDiffEnqueued: true })
    )
    expect(job.moveToWaitingChildren).toHaveBeenCalledWith('token-1')
  })

  it('skips re-fetch when resumed after children complete', async () => {
    const mod = await import('./extractGleifIds')
    const worker = mod.default as unknown as WorkerWithProcessor
    const { PipelineJob } = await import('../lib/PipelineWorker')
    const job = new (PipelineJob as any)({
      url: 'https://example.com/r.pdf',
      companyName: 'Acme',
      companyId: 'c1',
      lei: '5493001KJTIIGC8Y1R12',
      autoApprove: true,
      gleifDiffEnqueued: true,
      linked: { isins: [], isinTotal: 0, isinsTruncated: false, bics: [] },
    })

    const result = await worker.processor(job, {}, 'token-1')
    expect(getGleifLinkedIdentifiers).not.toHaveBeenCalled()
    expect(addDiff).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({ companyId: 'c1', lei: '5493001KJTIIGC8Y1R12' })
    )
  })
})
