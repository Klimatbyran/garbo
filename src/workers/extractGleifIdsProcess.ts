import { JobsOptions, WaitingChildrenError } from 'bullmq'
import type { GleifLeiLinkedIdentifiers } from '../lib/gleif'
import { normalizeLei } from '../lib/normalizeLei'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'

export type ExtractGleifJobLike = {
  id?: string
  queueQualifiedName: string
  data: {
    url: string
    autoApprove: boolean
    companyName: string
    companyId: string
    lei: string
    gleifDiffEnqueued?: boolean
    linked?: GleifLeiLinkedIdentifiers | null
    [key: string]: unknown
  }
  log: (msg: string) => Promise<unknown> | unknown
  sendMessage: (msg: string) => Promise<unknown>
  updateData: (data: ExtractGleifJobLike['data']) => Promise<unknown>
  moveToWaitingChildren: (token: string) => Promise<boolean>
}

/** BullMQ parent opts for diffGleifIds (queue must be queueQualifiedName). */
export function gleifDiffChildJobOpts(job: {
  id: string
  queueQualifiedName: string
}): JobsOptions {
  return withPipelineJobOpts({
    attempts: 3,
    // Keep sendCompanyLink moving if the GLEIF diff fails.
    failParentOnFailure: false,
    ignoreDependencyOnFailure: true,
    parent: {
      id: job.id,
      queue: job.queueQualifiedName,
    },
  })
}

export type ExtractGleifDeps = {
  getLinked: (lei: string) => Promise<GleifLeiLinkedIdentifiers | null>
  addDiff: (
    name: string,
    data: Record<string, unknown>,
    opts?: JobsOptions
  ) => Promise<unknown>
}

export async function processExtractGleifIds(
  job: ExtractGleifJobLike,
  token: string | undefined,
  deps: ExtractGleifDeps
): Promise<{
  companyId: string
  lei: string | null
  linked: GleifLeiLinkedIdentifiers | null
}> {
  const { companyName, companyId, lei } = job.data
  const normalizedLei = normalizeLei(lei)

  // Resumed after waiting for diffGleifIds children.
  if (job.data.gleifDiffEnqueued) {
    job.log('GLEIF diff child finished; completing extractGleifIds.')
    return {
      companyId,
      lei: normalizedLei,
      linked: job.data.linked ?? null,
    }
  }

  if (!normalizedLei) {
    job.log(
      `❌ Invalid LEI '${lei}' for GLEIF identifier lookup on '${companyName}'; skipping.`
    )
    return { companyId, lei: null, linked: null }
  }

  job.log(`Fetching GLEIF-linked identifiers for LEI ${normalizedLei}`)
  let linked: GleifLeiLinkedIdentifiers | null
  try {
    linked = await deps.getLinked(normalizedLei)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    job.log(`❌ GLEIF lookup failed: ${message}`)
    await job.sendMessage(
      `❌ Failed GLEIF identifier lookup for ${companyName} (LEI ${normalizedLei}): ${message}`
    )
    throw error
  }

  if (!linked) {
    job.log(`No GLEIF LEI record for ${normalizedLei}`)
    return { companyId, lei: normalizedLei, linked: null }
  }

  job.log(
    `GLEIF linked: isins=${linked.isins.length}/${linked.isinTotal} truncated=${linked.isinsTruncated} org=${linked.registeredAs ?? 'none'} bics=${JSON.stringify(linked.bics)} jurisdiction=${linked.jurisdiction}`
  )

  if (!job.id) {
    throw new Error(
      'extractGleifIds job is missing id; cannot parent diffGleifIds'
    )
  }

  await deps.addDiff(
    `${companyName} - GLEIF identifiers`,
    {
      ...job.data,
      lei: normalizedLei,
      linked,
    },
    gleifDiffChildJobOpts({
      id: job.id,
      queueQualifiedName: job.queueQualifiedName,
    })
  )

  await job.updateData({
    ...job.data,
    lei: normalizedLei,
    linked,
    gleifDiffEnqueued: true,
  })

  if (!token) {
    job.log(
      'No worker token available; cannot moveToWaitingChildren — completing without wait.'
    )
    return { companyId, lei: normalizedLei, linked }
  }

  const shouldWait = await job.moveToWaitingChildren(token)
  if (shouldWait) {
    throw new WaitingChildrenError()
  }

  return { companyId, lei: normalizedLei, linked }
}
