import { Worker, WorkerOptions, Job, Queue } from 'bullmq'
import redis from '../config/redis'
import { ChangeDescription } from './DiffWorker'
import { createPipelineLogger } from './logger'
import { Logger } from '@/types'
import { DEFAULT_PIPELINE_JOB_OPTIONS } from './pipelineJobOptions'

interface Approval {
  summary?: string
  approved: boolean
  data: ChangeDescription
  type: string
  metadata: {
    source: string
    comment: string
  }
  /** Garbo user id of human approver (set by Validate on Wikidata approve). */
  verifiedByUserId?: string
}

type ApprovedBody = Record<string, unknown> & {
  metadata?: Approval['metadata']
}

type ChildrenEntries = Record<string, unknown>

type PipelineMessage =
  | string
  | {
      content?: string
      components?: unknown
      [key: string]: unknown
    }

export class PipelineJob extends Job {
  declare data: {
    url: string
    /** Run identifier for report run tracking (set by pipeline-api). */
    threadId?: string
    autoApprove: boolean
    approval?: Approval
    /** Propagated from pipeline-api job create; used for batch filtering. */
    batchId?: string
  }

  sendMessage: (msg: PipelineMessage) => Promise<undefined>
  editMessage: (msg: PipelineMessage) => Promise<undefined>
  requestApproval: (
    type: string,
    data: Approval['data'],
    approved: boolean,
    metadata: Approval['metadata'],
    summary?: string
  ) => Promise<void>
  isDataApproved: () => boolean
  hasApproval: () => boolean
  getApprovedBody: () => ApprovedBody
  setThreadName: (name: string) => Promise<undefined>
  sendTyping: () => Promise<void>
  getChildrenEntries: () => Promise<ChildrenEntries>
}

function messageContent(msg: PipelineMessage): string | undefined {
  if (typeof msg === 'string') return msg
  return typeof msg.content === 'string' ? msg.content : undefined
}

function addCustomMethods(job: PipelineJob) {
  job.getChildrenEntries = async () => {
    return job
      .getChildrenValues()
      .then((values) => Object.values(values))
      .then((values) =>
        values.map((value) => {
          if (value && typeof value === 'string') {
            return JSON.parse(value) as Record<string, unknown>
          }
          return value as Record<string, unknown>
        })
      )
      .then((objects) => {
        const out: ChildrenEntries = {}
        for (const obj of objects as Record<string, unknown>[]) {
          if (!obj || typeof obj !== 'object') continue
          const payload =
            Object.prototype.hasOwnProperty.call(obj, 'value') &&
            obj.value &&
            typeof obj.value === 'object'
              ? (obj.value as Record<string, unknown>)
              : obj
          Object.assign(out, payload)
        }
        return out
      })
  }

  // Pipeline workers log progress to BullMQ job logs.
  job.sendMessage = async (msg: PipelineMessage) => {
    const content = messageContent(msg)
    if (content) await job.log(content)
    return undefined
  }

  job.sendTyping = async () => undefined

  job.requestApproval = async (
    type,
    data,
    approved = false,
    metadata,
    summary
  ) => {
    await job.updateData({
      ...job.data,
      approval: { summary, type, data, approved, metadata },
    })
  }

  job.isDataApproved = () => job.data.approval?.approved ?? false
  job.hasApproval = () => !!job.data.approval

  job.getApprovedBody = () => {
    const approvedValue = job.data.approval?.data.newValue
    const approvedData =
      approvedValue && typeof approvedValue === 'object'
        ? (approvedValue as Record<string, unknown>)
        : {}

    return {
      ...approvedData,
      metadata: job.data.approval?.metadata,
    }
  }

  job.editMessage = async (msg: PipelineMessage) => job.sendMessage(msg)

  job.setThreadName = async (_name: string): Promise<undefined> => undefined

  return job
}

export class PipelineWorker<T extends PipelineJob> extends Worker {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T, logger: Logger) => unknown,
    options?: WorkerOptions
  ) {
    super(
      name,
      async (raw: T) => {
        const job = addCustomMethods(raw) as T
        const logger = createPipelineLogger(job)
        return callback(job, logger)
      },
      {
        connection: redis,
        concurrency: 3,
        ...options,
      }
    )

    this.queue = new Queue(name, {
      connection: redis,
      defaultJobOptions: DEFAULT_PIPELINE_JOB_OPTIONS,
    })
  }
}
