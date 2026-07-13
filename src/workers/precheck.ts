import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import wikidata from '../prompts/wikidata'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { z } from 'zod'
import { QUEUE_NAMES } from '../queues'
import apiConfig from '../config/api'
import { apiFetch } from '../lib/api'
import { resolvePipelineCompanyOutcome } from '../lib/pipelineCompanyResolve'
import { syncCanonicalReportRunCompanyId } from '../lib/pipelineRunCompanyId'
import { EXTRACT_EMISSIONS_CHILD_QUEUES } from './precheckFlow'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'

class PrecheckJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    cachedMarkdown?: string
    companyName?: string
    companyId?: string
    lei?: string
    waitingForCompanyName?: boolean
  }
}

const flow = new FlowProducer({ connection: redis })
flow.on('error', (err) => console.error('FlowProducer connection error:', err))

const companyNameSchema = z.object({
  companyName: z.string().nullable(),
})

async function createPipelineCompany(companyName: string): Promise<string> {
  const created = await apiFetch('/companies/', {
    body: { name: companyName },
  })
  if (!created?.id) {
    throw new Error('Company create did not return id')
  }
  return created.id as string
}

async function syncRunCompanyIdFromPrecheck(
  job: PrecheckJob,
  companyId: string,
  companyName: string
) {
  const threadId = job.data.threadId?.trim()
  if (!threadId) return

  await syncCanonicalReportRunCompanyId({
    threadId,
    companyId,
    pdfUrl: job.data.url,
    companyName,
  })
}

async function ensurePipelineCompany(
  job: PrecheckJob,
  companyName: string
): Promise<string | null> {
  if (job.data.approval?.type === 'companyLink' && job.isDataApproved()) {
    const approved = job.getApprovedBody()
    if (approved.createNew) {
      const companyId = await createPipelineCompany(companyName)
      await job.updateData({ ...job.data, companyId, companyName })
      job.log(`Created new company after company-link approval id=${companyId}`)
      await syncRunCompanyIdFromPrecheck(job, companyId, companyName)
      return companyId
    }
    if (typeof approved.companyId === 'string' && approved.companyId.trim()) {
      const companyId = approved.companyId.trim()
      await job.updateData({ ...job.data, companyId, companyName })
      job.log(`Using staff-selected company id=${companyId}`)
      await syncRunCompanyIdFromPrecheck(job, companyId, companyName)
      return companyId
    }
  }

  if (
    job.data.approval?.type === 'companyLink' &&
    job.hasApproval() &&
    !job.isDataApproved()
  ) {
    job.log('Waiting for company link approval')
    await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    return null
  }

  const outcome = await resolvePipelineCompanyOutcome(job.data, companyName)

  if (outcome.status === 'resolved') {
    if (outcome.companyId !== job.data.companyId) {
      await job.updateData({
        ...job.data,
        companyId: outcome.companyId,
        companyName,
      })
      job.log(
        `Resolved pipeline company id=${outcome.companyId} method=${outcome.method}`
      )
    }
    await syncRunCompanyIdFromPrecheck(job, outcome.companyId, companyName)
    return outcome.companyId
  }

  if (outcome.status === 'ambiguous') {
    job.log(
      `Ambiguous company link for "${companyName}" — ${outcome.candidates.length} candidates`
    )
    job.log(
      `Company link candidates: ${JSON.stringify(outcome.candidates, null, 2)}`
    )

    const metadata = {
      source: 'company-name-search',
      comment:
        'Multiple matching companies found — please select the correct company',
    }

    await job.requestApproval(
      'companyLink',
      {
        type: 'companyLink',
        newValue: {
          extractedName: outcome.extractedName,
          candidates: outcome.candidates,
        },
      },
      false,
      metadata,
      `Company link for ${companyName}`
    )

    await job.sendMessage({
      content: `Multiple companies match "${companyName}". Please select the correct company in Validate before the pipeline continues.`,
    })
    await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    return null
  }

  const companyId = await createPipelineCompany(companyName)
  await job.updateData({ ...job.data, companyId, companyName })
  job.log(`Created pipeline company id=${companyId}`)
  await syncRunCompanyIdFromPrecheck(job, companyId, companyName)
  return companyId
}

const precheck = new PipelineWorker(
  QUEUE_NAMES.PRECHECK,
  async (job: PrecheckJob) => {
    const {
      cachedMarkdown,
      waitingForCompanyName,
      companyName: existingCompanyName,
      ...baseData
    } = job.data
    const { markdown = cachedMarkdown } = await job.getChildrenEntries()

    if (existingCompanyName && waitingForCompanyName) {
      job.log('Using manually provided company name: ' + existingCompanyName)
      await job.updateData({ ...job.data, waitingForCompanyName: false })
      return processWithCompanyName(existingCompanyName)
    }

    async function extractCompanyName(
      markdown: string,
      retry = 3,
      start = 0,
      chunkSize = 5000
    ): Promise<string | null> {
      if (retry <= 0 || start >= markdown.length) return null
      const chunk = markdown.substring(start, start + chunkSize)
      const response = await askStream(
        [
          {
            role: 'user',
            content: `What is the name of the company? Respond only with the company name, leave null if you cannot find it. We will search Wikidata for this name. The following is an extract from a PDF:
            
            ${chunk}
            `,
          },
        ],
        {
          response_format: zodResponseFormat(
            companyNameSchema,
            `companyName-${retry}`
          ),
        }
      ).then(JSON.parse)

      const { companyName: rawName } = companyNameSchema.parse(response)
      const companyName = rawName ? rawName.trim() : null

      return (
        companyName ||
        extractCompanyName(markdown, retry - 1, start + chunkSize, chunkSize)
      )
    }

    const companyName = await extractCompanyName(markdown as string)

    if (companyName) {
      await job.updateData({ ...job.data, companyName })
    }

    if (!companyName) {
      if (waitingForCompanyName) {
        job.log('Still waiting for companyName in job data...')
        await job.moveToDelayed(Date.now() + 30000)
        return
      }

      throw new Error(
        'Could not identify company name from report. Re-run with companyName provided in job data.'
      )
    }

    return processWithCompanyName(companyName)

    async function processWithCompanyName(companyName: string) {
      job.log('Company name: ' + companyName)

      const companyId = await ensurePipelineCompany(job, companyName)
      if (!companyId) return

      const base = {
        data: { ...job.data, companyName, companyId },
        opts: withPipelineJobOpts({
          attempts: 3,
        }),
      }

      job.sendMessage('🤖 Asking questions about basic facts...')

      try {
        const extractEmissions = await flow.add({
          name: 'precheck done ' + companyName,
          queueName: QUEUE_NAMES.EXTRACT_EMISSIONS,
          data: { ...base.data },
          children: [
            {
              ...base,
              queueName: EXTRACT_EMISSIONS_CHILD_QUEUES[0],
              name: 'fiscalYear ' + companyName,
            },
          ],
          opts: withPipelineJobOpts({
            attempts: 3,
          }),
        })

        await flow.add({
          name: 'guessWikidata ' + companyName,
          queueName: QUEUE_NAMES.GUESS_WIKIDATA,
          data: {
            ...base.data,
            schema: zodResponseFormat(wikidata.schema, 'wikidata'),
          },
          opts: withPipelineJobOpts({
            attempts: 3,
          }),
        })

        return extractEmissions.job?.id
      } catch (error) {
        job.log('Error: ' + error)
        job.editMessage('❌ Error: ' + error)
        throw error
      }
    }
  }
)

export default precheck
