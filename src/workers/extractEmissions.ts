import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { JobType } from '../types'
import { QUEUE_NAMES } from '../queues'

class ExtractEmissionsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    type: JobType
  }
}

const flow = new FlowProducer({ connection: redis })

const extractEmissions = new DiscordWorker<ExtractEmissionsJob>(
  QUEUE_NAMES.EXTRACT_EMISSIONS,
  async (job) => {
    const { companyName } = job.data
    job.sendMessage(`🤖 Hämtar utsläppsdata...`)

    const { wikidata, fiscalYear } = await job.getChildrenEntries()


    // updating the job data with the values we seek
    const base = {
      name: companyName,
      data: { ...job.data, wikidata, fiscalYear },
      queueName: QUEUE_NAMES.FOLLOW_UP,
      opts: {
        attempts: 3,
      },
    }

    await flow.add({
      name: companyName,
      queueName: QUEUE_NAMES.CHECK_DB,
      data: {
        ...base.data,
      },
      children: [
        {
          ...base,
          name: 'industryGics ' + companyName,
          data: {
            ...base.data,
            type: JobType.IndustryGics,
          },
        },
        {
          ...base,
          name: 'scope1+2 ' + companyName,
          data: {
            ...base.data,
            type: JobType.Scope12,
          },
        },
        {
          ...base,
          name: 'scope3 ' + companyName,
          data: {
            ...base.data,
            type: JobType.Scope3,
          },
        },
        {
          ...base,
          name: 'biogenic ' + companyName,
          data: {
            ...base.data,
            type: JobType.Biogenic,
          },
        },
        {
          ...base,
          name: 'economy ' + companyName,
          data: {
            ...base.data,
            type: JobType.Economy,
          },
        },
        {
          ...base,
          name: 'goals ' + companyName,
          data: {
            ...base.data,
            type: JobType.Goals,
          },
        },
        {
          ...base,
          name: 'initiatives ' + companyName,
          data: {
            ...base.data,
            type: JobType.Initiatives,
          },
        },
        {
          ...base,
          name: 'baseYear ' + companyName,
          data: {
            ...base.data,
            type: JobType.BaseYear,
          },
        },
        {
          ...base,
          name: 'lei ' + companyName,
          queueName: QUEUE_NAMES.EXTRACT_LEI,
          data: {
            ...base.data,
            wikidataId: base.data.wikidata.node
          }
        },
        {
          name: 'descriptions ' + companyName,
          queueName: QUEUE_NAMES.EXTRACT_DESCRIPTIONS,
          data: {
            ...job.data,
            companyId: wikidata.node,
            type: undefined,
          },

        },
      ],
      opts: {
        attempts: 3,
      },
    })

    job.sendMessage(`🤖 Ställer följdfrågor...`)
    return true
  }
)

export default extractEmissions
