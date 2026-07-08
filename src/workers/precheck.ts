import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import wikidata from '../prompts/wikidata'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { z } from 'zod'
import { QUEUE_NAMES } from '../queues'
import { resolveOrCreatePipelineCompanyId } from '../lib/pipelineCompanyResolve'
import { EXTRACT_EMISSIONS_CHILD_QUEUES } from './precheckFlow'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'

class PrecheckJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    cachedMarkdown?: string
    companyName?: string
    companyId?: string
    waitingForCompanyName?: boolean
  }
}

const flow = new FlowProducer({ connection: redis })
flow.on('error', (err) => console.error('FlowProducer connection error:', err))

const companyNameSchema = z.object({
  companyName: z.string().nullable(),
})

async function ensurePipelineCompany(
  job: PrecheckJob,
  companyName: string
): Promise<string> {
  const { companyId, method } = await resolveOrCreatePipelineCompanyId(
    job.data,
    companyName
  )
  if (companyId !== job.data.companyId) {
    await job.updateData({ ...job.data, companyId, companyName })
    job.log(`Resolved pipeline company id=${companyId} method=${method}`)
  }
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

      const base = {
        data: { ...baseData, companyName, companyId },
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
