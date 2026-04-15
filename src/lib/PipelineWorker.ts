import { Worker, WorkerOptions, Job, Queue } from 'bullmq'
import redis from '../config/redis'
import { createPipelineLogger } from './logger'
import { Logger } from '@/types'

export interface PipelineChangeDescription {
  type: string
  oldValue?: unknown
  newValue: unknown
}

interface Approval {
  summary?: string
  approved: boolean
  data: PipelineChangeDescription
  type: string
  metadata: {
    source: string
    comment: string
  }
}

export class PipelineJob extends Job {
  declare data: {
    url: string
    threadId?: string
    channelId?: string
    messageId?: string
    autoApprove: boolean
    approval?: Approval
    batchId?: string
  }

  sendMessage: (msg: string | Record<string, unknown>) => Promise<undefined>
  editMessage: (msg: string | Record<string, unknown>) => Promise<undefined>
  requestApproval: (
    type: string,
    data: Approval['data'],
    approved: boolean,
    metadata: Approval['metadata'],
    summary?: string
  ) => Promise<void>
  isDataApproved: () => boolean
  hasApproval: () => boolean
  getApprovedBody: () => Record<string, unknown>
  setThreadName: (name: string) => Promise<undefined>
  sendTyping: () => Promise<void>
  getChildrenEntries: () => Promise<Record<string, unknown>>
  hasValidThreadId: () => boolean
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
        const out: Record<string, unknown> = {}
        for (const obj of objects) {
          if (!obj || typeof obj !== 'object') continue
          const payload =
            Object.prototype.hasOwnProperty.call(obj, 'value') &&
            (obj as { value?: unknown }).value &&
            typeof (obj as { value?: unknown }).value === 'object'
              ? ((obj as { value: Record<string, unknown> })
                  .value as Record<string, unknown>)
              : (obj as Record<string, unknown>)
          Object.assign(out, payload)
        }
        return out
      })
  }

  job.hasValidThreadId = function () {
    return (
      typeof this.data.threadId === 'string' &&
      /^\d{17,19}$/.test(this.data.threadId)
    )
  }

  // Pipeline mode: log-only messaging helpers.
  job.sendMessage = async (msg: string | Record<string, unknown>) => {
    const content = typeof msg === 'string' ? msg : (msg.content as string)
    if (content) job.log(content)
    return undefined
  }

  job.sendTyping = async () => {
    return
  }

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
    return {
      ...(job.data.approval?.data.newValue as Record<string, unknown>),
      metadata: job.data.approval?.metadata,
    }
  }

  job.editMessage = async (msg: string | Record<string, unknown>) => {
    return job.sendMessage(msg)
  }

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
    this.queue = new Queue(name, { connection: redis })
  }
}
