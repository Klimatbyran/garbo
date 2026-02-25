import { DiscordJob, DiscordWorker } from './DiscordWorker'
import { Queue } from 'bullmq'
import redis from '../config/redis'
import saveToAPI from '../workers/saveToAPI'
import { defaultMetadata } from './saveUtils'
import discord from '../discord'

export interface ChangeDescription {
  type: string
  oldValue?
  newValue
}

export class DiffJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: { node: string }
  }

  enqueueSaveToAPI: (
    apiSubEndpoint: string,
    companyName: string,
    wikidata: { node: string },
    body: any
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
    await saveToAPI.queue.add(companyName + ' ' + apiSubEndpoint, {
      ...job.data,
      companyName,
      wikidata,
      body,
      apiSubEndpoint,
    })
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
        defaultMetadata(job.data.url),
        `Updates to the company's ${apiSubEndpoint}`
      )
    } else if (diff) {
      await job.enqueueSaveToAPI(
        apiSubEndpoint,
        job.data.companyName,
        job.data.wikidata,
        {
          ...change.newValue,
          metadata: defaultMetadata(job.data.url),
        }
      )
    }
  }

  return job
}
export class DiffWorker<T extends DiffJob> extends DiscordWorker<DiffJob> {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T) => any,
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
