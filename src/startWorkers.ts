import discord from './discord'
import { workers } from './workers'
import { QueueEvents, Queue } from 'bullmq'
import redis from './config/redis'
import { QUEUE_NAMES } from './queues'
import { prisma } from './lib/prisma'

for (const queueName of Object.values(QUEUE_NAMES)) {
  const queueEvents = new QueueEvents(queueName, { connection: redis })
  const queue = new Queue(queueName, { connection: redis })

  const saveRun = async (jobId: string, status: 'completed' | 'failed', failedReason?: string) => {
    try {
      const job = await queue.getJob(jobId)
      if (!job) {
        console.log(`[ReportRun] job ${jobId} not found in ${queueName}`)
        return
      }

      const pdfUrl = job.data?.url
      if (!pdfUrl) {
        console.log(`[ReportRun] no pdfUrl for job ${jobId} in ${queueName}`)
        return
      }

      const wikidataId = job.data?.wikidata?.node ?? null
      const companyName = job.data?.companyName ?? null
      const threadId = job.data?.threadId ?? null

      if (!threadId) {
        console.log(`[ReportRun] skipping job ${jobId} in ${queueName} — no threadId`)
        return
      }

      console.log(`[ReportRun] saving job ${jobId} in ${queueName} for thread ${threadId}`)

      const reportRun = await prisma.reportRun.upsert({
        where: { threadId },
        create: { threadId, pdfUrl, companyName, wikidataId },
        update: {
          companyName: companyName ?? undefined,
          wikidataId: wikidataId ?? undefined,
        },
      })

      let returnValue: Record<string, any> | null = null
      if (job.returnvalue) {
        try {
          returnValue = typeof job.returnvalue === 'string'
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
          failedReason: failedReason ?? null,
          prompt: returnValue?.metadata?.prompt ?? null,
          queryTexts: returnValue?.metadata?.queryTexts ?? null,
          markdown: returnValue?.metadata?.context ?? null,
          startedAt: job.processedOn ? new Date(job.processedOn) : null,
          finishedAt: new Date(),
          reportRunId: reportRun.id,
          wikidataId: wikidataId ?? undefined,
          approved_timestamp: null, 
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
      }
    } catch (err) {
      console.error(`[ReportRun] failed to save run for job ${jobId}:`, err)
    }
  }

  queueEvents.on('completed', ({ jobId }) => saveRun(jobId, 'completed'))
  queueEvents.on('failed', ({ jobId, failedReason }) => saveRun(jobId, 'failed', failedReason))
}

console.log('Starting workers...')

Promise.all(
  workers.map((worker) => {
    return worker.run()
  })
)
  .then((results) => results.join('\n'))
  .then(console.log)
  .catch((error) => {
    console.error('Error starting workers:', error)
    process.exit(1)
  })

async function connectWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries) throw err
      const error = err as Error
      console.log(
        `Connection attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
  throw new Error('Failed to connect after maximum retries')
}

try {
  await connectWithRetry(() => discord.login())
  console.log('Discord bot started')
} catch (error) {
  console.error('Failed to start Discord bot:', error)
  process.exit(1)
}
