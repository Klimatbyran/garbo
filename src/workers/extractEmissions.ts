import { FlowChildJob, FlowProducer } from 'bullmq'
import redis from '../config/redis'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'

type FollowUpKey =
  | 'industryGics'
  | 'scope1+2'
  | 'scope3'
  | 'biogenic'
  | 'economy'
  | 'goals'
  | 'initiatives'
  | 'baseYear'
  | 'lei'
  | 'descriptions'

class ExtractEmissionsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    runOnly?: (FollowUpKey | 'all')[]
  }
}

const flow = new FlowProducer({ connection: redis })

const extractEmissions = new DiscordWorker<ExtractEmissionsJob>(
  QUEUE_NAMES.EXTRACT_EMISSIONS,
  async (job) => {
    const { companyName, runOnly } = job.data
    job.sendMessage(`🤖 Fetching emissions data...`)

    const { wikidata, fiscalYear } = await job.getChildrenEntries()


    // updating the job data with the values we seek
    const base = {
      name: companyName,
      data: { ...job.data, wikidata, fiscalYear },
      opts: {
        attempts: 3,
      },
    }

    job.log('🔍 Running these workers : ' + runOnly?.join(', '))

    // a worker should run if it is explicitly in the runOnly array or if runOnly is 'all'
    const shouldRun = (key: FollowUpKey) => {
      if (!runOnly) return true
      if (runOnly.includes('all')) return true
      return runOnly.includes(key)
    }
    
    const childrenJobs: { key: FollowUpKey, job: FlowChildJob }[] = [
      {
        key: 'industryGics',
        job: {
          ...base,
          name: 'industryGics ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_INDUSTRY_GICS,
        }
      },
      {
        key: 'scope1+2',
        job: {
          ...base,
          name: 'scope1+2 ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_SCOPE_12,
        }
      },
      {
        key: 'scope3',
        job: {
          ...base,
          name: 'scope3 ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_SCOPE_3,
        }
      },
      {
        key: 'biogenic',
        job: {
          ...base,
          name: 'biogenic ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_BIOGENIC,
        }
      },
      {
        key: 'economy',
        job: {
          ...base,
          name: 'economy ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_ECONOMY,
        }
      },
      {
        key: 'goals',
        job: {
          ...base,
          name: 'goals ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_GOALS,
        }
      },
      {
        key: 'initiatives',
        job: {
          ...base,
          name: 'initiatives ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_INITIATIVES,
        }
      },
      {
        key: 'baseYear',
        job: {
          ...base,
          name: 'baseYear ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_BASE_YEAR,
        }
      },  
      {
        key: 'lei',
        job: {
          ...base,
          name: 'lei ' + companyName,
          queueName: QUEUE_NAMES.EXTRACT_LEI,
          data: {
            ...base.data,
            wikidataId: base.data.wikidata.node
          }
        }
      },
      {
        key: 'descriptions',
        job: {
          ...base,
          name: 'descriptions ' + companyName,
          queueName: QUEUE_NAMES.EXTRACT_DESCRIPTIONS,
          data: {
            ...job.data,
            companyId: wikidata.node,
            type: undefined,
          }
        }
      }
    ]


    await flow.add({
      name: companyName,
      queueName: QUEUE_NAMES.CHECK_DB,
      data: {
        ...base.data,
      },
      children: [
        ...childrenJobs.filter((child) => shouldRun(child.key)).map((child) => child.job),
      ].filter((e) => e !== null),
      opts: {
        attempts: 3,
      },
    })

    job.sendMessage(`🤖 Asking follow-up questions...`)
    return true
  }
)

export default extractEmissions
