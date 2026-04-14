import { Worker, WorkerOptions, Job, Queue } from 'bullmq'
import redis from '../config/redis'
import { ChangeDescription } from './DiffWorker'
import { createPipelineLogger } from './logger'
import { Logger } from '@/types'

interface Approval {
  summary?: string
  approved: boolean
  data: ChangeDescription
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
    channelId: string
    messageId?: string
    autoApprove: boolean
    approval?: Approval
    /** Propagated from pipeline-api job create; used for batch filtering. */
    batchId?: string
  }

  sendMessage: (msg: string | Record<string, any>) => Promise<undefined>
  editMessage: (msg: string | Record<string, any>) => Promise<undefined>
  requestApproval: (
    type: string,
    data: Approval['data'],
    approved: boolean,
    metadata: Approval['metadata'],
    summary?: string
  ) => Promise<void>
  isDataApproved: () => boolean
  hasApproval: () => boolean
  getApprovedBody: () => any
  setThreadName: (name: string) => Promise<undefined>
  sendTyping: () => Promise<void>
  getChildrenEntries: () => Promise<any>
  hasValidThreadId: () => boolean
}

function addCustomMethods(job: PipelineJob) {
  /**
   * Combine results of children jobs into a single object.
   */
  job.getChildrenEntries = async () => {
    return job
      .getChildrenValues()
      .then((values) => Object.values(values))
      .then((values) =>
        values.map((value) => {
          if (value && typeof value === 'string') {
            return JSON.parse(value)
          } else {
            return value
          }
        })
      )
      .then((objects) => {
        const out: Record<string, any> = {}
        for (const obj of objects as Record<string, any>[]) {
          if (!obj || typeof obj !== 'object') continue
          const payload =
            Object.prototype.hasOwnProperty.call(obj, 'value') &&
            obj.value &&
            typeof obj.value === 'object'
              ? (obj.value as Record<string, any>)
              : obj
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

  job.sendMessage = async (msg: string | Record<string, any>) => {
    const content = typeof msg === 'string' ? msg : msg?.content
    if (content) {
      job.log(content)
    }
    return undefined
  }

  job.sendTyping = async () => {
    return
  }

  job.requestApproval = async (
    type: string,
    data: ChangeDescription,
    approved: boolean = false,
    metadata: Approval['metadata'],
    summary?: string
  ) => {
    await job.updateData({
      ...job.data,
      approval: { summary, type, data, approved, metadata },
    })
  }

  job.isDataApproved = () => {
    return job.data.approval?.approved ?? false
  }

  job.hasApproval = () => {
    return !!job.data.approval
  }

  job.getApprovedBody = () => {
    return {
      ...job.data.approval?.data.newValue,
      metadata: job.data.approval?.metadata,
    }
  }

  job.editMessage = async (msg: string | Record<string, any>) => {
    return job.sendMessage(msg)
  }

  job.setThreadName = async (_name: string): Promise<undefined> => {
    return undefined
  }

  return job
}

export class PipelineWorker<T extends PipelineJob> extends Worker {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T, logger: Logger) => any,
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
