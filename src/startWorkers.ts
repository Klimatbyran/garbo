import { workers } from './workers'
import { QueueEvents, Queue } from 'bullmq'
import redis from './config/redis'
import { QUEUE_NAMES } from './queues'
import { prisma } from './lib/prisma'
import {
  resolveReportBatchDbId,
  companyReportIdFromJobData,
  companyIdFromJobData,
} from './lib/reportRunPersistence'
import { DEFAULT_PIPELINE_JOB_OPTIONS } from './lib/pipelineJobOptions'
import { requestPipelineRunPrune } from './lib/pipelineApiPrune'

for (const queueName of Object.values(QUEUE_NAMES)) {
  const queueEvents = new QueueEvents(queueName, { connection: redis })
  const queue = new Queue(queueName, {
    connection: redis,
    defaultJobOptions: DEFAULT_PIPELINE_JOB_OPTIONS,
  })

  const saveRun = async (
    jobId: string,
    status: 'completed' | 'failed',
    failedReason?: string
  ) => {
    try {
      const job = await queue.getJob(jobId)
      if (!job) {
        return
      }

      const pdfUrl = job.data?.url
      if (!pdfUrl) {
        return
      }

      const wikidataId = job.data?.wikidata?.node ?? null
      const companyId = companyIdFromJobData(job.data)
      const companyName = job.data?.companyName ?? null
      const companyReportId = companyReportIdFromJobData(job.data)
      const threadId = job.data?.threadId ?? null
      const rawBatchId = (job.data as { batchId?: unknown } | undefined)
        ?.batchId
      const batchDbId = await resolveReportBatchDbId(
        typeof rawBatchId === 'string' ? rawBatchId : null
      )

      if (!threadId) {
        return
      }

      const existingReportRun = await prisma.reportRun.findUnique({
        where: { threadId },
        select: { id: true },
      })

      const reportRun = existingReportRun
        ? await prisma.reportRun.update({
            where: { threadId },
            data: {
              companyName: companyName ?? undefined,
              ...(companyReportId ? { companyReportId } : {}),
              ...(batchDbId ? { batchDbId } : {}),
            },
          })
        : await prisma.reportRun.create({
            data: {
              threadId,
              pdfUrl,
              companyName,
              companyId,
              wikidataId,
              companyReportId,
              batchDbId,
            },
          })

      let returnValue: Record<string, any> | null = null
      if (job.returnvalue) {
        try {
          returnValue =
            typeof job.returnvalue === 'string'
              ? JSON.parse(job.returnvalue)
              : job.returnvalue
        } catch {
          // returnvalue is not JSON (e.g. precheck returns a plain string)
        }
      }

      await prisma.reportRunJob.create({
        data: {
          jobId,
          queueName,
          status,
          companyId,
          wikidataId: wikidataId ?? null,
          approvedTimestamp:
            status === 'completed' ? new Date().toISOString() : null,
          autoApprove: Boolean(
            (job.data as { autoApprove?: unknown } | undefined)?.autoApprove
          ),
          failedReason: failedReason ?? null,
          prompt: returnValue?.metadata?.prompt ?? null,
          queryTexts: returnValue?.metadata?.queryTexts ?? null,
          markdown: returnValue?.metadata?.context ?? null,
          chromaDurationMs: returnValue?.metadata?.chromaDurationMs ?? null,
          aiDurationMs: returnValue?.metadata?.aiDurationMs ?? null,
          startedAt: job.processedOn ? new Date(job.processedOn) : null,
          finishedAt: new Date(),
          reportRunId: reportRun.id,
        },
      })

      // Mark the run as completed when sendCompanyLink finishes, failed on any failure
      if (status === 'failed') {
        await prisma.reportRun.update({
          where: { id: reportRun.id },
          data: { status: 'failed' },
        })
      } else if (queueName === QUEUE_NAMES.SEND_COMPANY_LINK) {
        await prisma.reportRun.update({
          where: { id: reportRun.id },
          data: { status: 'completed' },
        })

        if (threadId) {
          requestPipelineRunPrune({ threadId })
        }
      }
    } catch (err) {
      console.error(`[ReportRun] failed to save run for job ${jobId}:`, err)
    }
  }

  queueEvents.on('completed', ({ jobId }) => saveRun(jobId, 'completed'))
  queueEvents.on('failed', ({ jobId, failedReason }) =>
    saveRun(jobId, 'failed', failedReason)
  )
}

Promise.all(
  workers.map((worker) => {
    return worker.run()
  })
)
  .then(() => {
    console.log('Workers started')
  })
  .catch((error) => {
    console.error('Error starting workers:', error)
    process.exit(1)
  })
