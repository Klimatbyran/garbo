import { describe, it, expect, jest } from '@jest/globals'
import { WaitingChildrenError } from 'bullmq'
import {
  gleifDiffChildJobOpts,
  processExtractGleifIds,
  type ExtractGleifDeps,
  type ExtractGleifJobLike,
} from './extractGleifIdsProcess'

function makeJob(data: ExtractGleifJobLike['data']): ExtractGleifJobLike {
  return {
    id: 'job-1',
    queueQualifiedName: 'bull:extractGleifIds',
    data,
    log: jest.fn(async () => undefined),
    sendMessage: jest.fn(async () => undefined),
    updateData: jest.fn(async () => undefined),
    moveToWaitingChildren: jest.fn(async () => true),
  }
}

describe('gleifDiffChildJobOpts', () => {
  it('parents with queueQualifiedName, not bare queueName', () => {
    const opts = gleifDiffChildJobOpts({
      id: 'job-1',
      queueQualifiedName: 'bull:extractGleifIds',
    })
    expect(opts.parent).toEqual({
      id: 'job-1',
      queue: 'bull:extractGleifIds',
    })
    expect(opts.failParentOnFailure).toBe(false)
    expect(opts.ignoreDependencyOnFailure).toBe(true)
    expect(opts.attempts).toBe(3)
  })
})

describe('processExtractGleifIds', () => {
  it('enqueues diff with qualified parent and waits for children', async () => {
    const addDiff: ExtractGleifDeps['addDiff'] = jest.fn(async () => ({}))
    const getLinked: ExtractGleifDeps['getLinked'] = jest.fn(async () => ({
      lei: '5493001KJTIIGC8Y1R12',
      isins: ['SE0000108656'],
      isinTotal: 1,
      isinsTruncated: false,
      registeredAs: 'Org',
      bics: [],
      jurisdiction: 'SE',
    }))
    const job = makeJob({
      url: 'https://example.com/r.pdf',
      autoApprove: true,
      companyName: 'Acme',
      companyId: 'c1',
      lei: '5493001KJTIIGC8Y1R12',
    })

    await expect(
      processExtractGleifIds(job, 'token-1', { getLinked, addDiff })
    ).rejects.toBeInstanceOf(WaitingChildrenError)

    expect(addDiff).toHaveBeenCalledTimes(1)
    const opts = (addDiff as jest.Mock).mock.calls[0]?.[2] as Record<
      string,
      unknown
    >
    expect(opts).toEqual(
      expect.objectContaining({
        parent: { id: 'job-1', queue: 'bull:extractGleifIds' },
      })
    )
    expect(job.updateData).toHaveBeenCalledWith(
      expect.objectContaining({ gleifDiffEnqueued: true })
    )
    expect(job.moveToWaitingChildren).toHaveBeenCalledWith('token-1')
  })

  it('skips re-fetch when resumed after children complete', async () => {
    const addDiff: ExtractGleifDeps['addDiff'] = jest.fn(async () => ({}))
    const getLinked: ExtractGleifDeps['getLinked'] = jest.fn(async () => null)
    const job = makeJob({
      url: 'https://example.com/r.pdf',
      autoApprove: true,
      companyName: 'Acme',
      companyId: 'c1',
      lei: '5493001KJTIIGC8Y1R12',
      gleifDiffEnqueued: true,
      linked: {
        lei: '5493001KJTIIGC8Y1R12',
        isins: [],
        isinTotal: 0,
        isinsTruncated: false,
        bics: [],
        registeredAs: null,
        jurisdiction: null,
      },
    })

    const result = await processExtractGleifIds(job, 'token-1', {
      getLinked,
      addDiff,
    })

    expect(getLinked).not.toHaveBeenCalled()
    expect(addDiff).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({
        companyId: 'c1',
        lei: '5493001KJTIIGC8Y1R12',
      })
    )
  })
})
