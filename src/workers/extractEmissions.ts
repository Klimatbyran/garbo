import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'

class ExtractEmissionsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
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
          queueName: QUEUE_NAMES.FOLLOW_UP_INDUSTRY_GICS,
        },
        {
          ...base,
          name: 'scope1+2 ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_SCOPE_12,
        },
        {
          ...base,
          name: 'scope3 ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_SCOPE_3,
        },
        {
          ...base,
          name: 'biogenic ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_BIOGENIC,
        },
        {
          ...base,
          name: 'economy ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_ECONOMY,
        },
        {
          ...base,
          name: 'goals ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_GOALS,
        },
        {
          ...base,
          name: 'initiatives ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_INITIATIVES,
        },
        {
          ...base,
          name: 'baseYear ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_BASE_YEAR,
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
