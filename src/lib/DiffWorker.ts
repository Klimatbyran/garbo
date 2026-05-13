import { PipelineJob, PipelineWorker } from './PipelineWorker'
import { Job, Queue, WorkerOptions } from 'bullmq'
import redis from '../config/redis'
import saveToAPI from '../workers/saveToAPI'
import { canonicalPublicReportUrl, defaultMetadata } from './saveUtils'
import discord from '../pipelineBridge'

/**
 * Enqueue saveToAPI with a BullMQ parent link when possible. If the parent job
 * key is no longer in Redis (retention, cleanup, or inconsistent state),
 * retries without the parent so the save can still run.
 */
export async function enqueueSaveToAPIWithParentFallback(
  job: Job,
  name: string,
  data: Record<string, unknown>
): Promise<void> {
  const parentOpts = job.id
    ? { parent: { id: job.id, queue: job.queueName } }
    : undefined

  try {
    await saveToAPI.queue.add(name, data, parentOpts)
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : ''

    if (msg.includes('Missing key for parent job')) {
      await job.log(
        `saveToAPI enqueue: parent missing; retrying without parent. (${msg})`
      )
      await saveToAPI.queue.add(name, data)
      return
    }

    throw error
  }
}

export interface ChangeDescription {
  type: string
  oldValue?
  newValue
}

export class DiffJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    wikidata: { node: string }
  }

  enqueueSaveToAPI: (
    apiSubEndpoint: string,
    companyName: string,
    wikidata: { node: string },
    body: Record<string, unknown>
  ) => Promise<void>

  handleDiff: (
    apiSubEndpoint: string,
    diff: string,
    change: ChangeDescription,
    requiresApproval: boolean
  ) => Promise<void>
}

function addCustomMethods(job: DiffJob) {
  job.enqueueSaveToAPI = async (
    apiSubEndpoint,
    companyName,
    wikidata,
    body
  ) => {
    const name = companyName + ' ' + apiSubEndpoint
    const data = {
      ...job.data,
      companyName,
      wikidata,
      body,
      apiSubEndpoint,
    }

    await enqueueSaveToAPIWithParentFallback(job, name, data)
  }

  job.handleDiff = async (apiSubEndpoint, diff, change, requiresApproval) => {
    if (diff && requiresApproval && !job.data.autoApprove) {
      job.log('The data needs approval before saving to API.')

      await job.sendMessage({
        content: `## ${apiSubEndpoint}\n\nNew changes for ${job.data.companyName}\n\n${diff}`,
      })
      // If approval is required and not yet approved, send approval request
      const buttonRow = discord.createApproveButtonRow(job)

      await job.editMessage({
        components: [buttonRow],
      })
      await job.requestApproval(
        apiSubEndpoint,
        change,
        job.data.autoApprove || !requiresApproval,
        defaultMetadata(
          canonicalPublicReportUrl(
            job.data as { url: string; sourceUrl?: string }
          )
        ),
        `Updates to the company's ${apiSubEndpoint}`
      )
    } else if (diff) {
      await job.enqueueSaveToAPI(
        apiSubEndpoint,
        job.data.companyName,
        job.data.wikidata,
        {
          ...change.newValue,
          metadata: defaultMetadata(
            canonicalPublicReportUrl(
              job.data as { url: string; sourceUrl?: string }
            )
          ),
        }
      )
    }
  }

  return job
}
export class DiffWorker<T extends DiffJob> extends PipelineWorker<DiffJob> {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T) => unknown,
    options?: WorkerOptions
  ) {
    super(name, (job: T) => callback(addCustomMethods(job) as T), {
      connection: redis,
      concurrency: 3,
      ...options,
    })

    this.queue = new Queue(name, { connection: redis })
  }
}
