import { FlowChildJob, FlowProducer } from 'bullmq'
import redis from '../config/redis'
import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { QUEUE_NAMES } from '../queues'

/** Keys for follow-up workers that can be run selectively via runOnly (e.g. manual re-run in validation UI). */
export type FollowUpKey =
  | 'industryGics'
  | 'scope1'
  | 'scope2'
  | 'scope1+2'
  | 'scope3'
  | 'biogenic'
  | 'economy'
  | 'goals'
  | 'initiatives'
  | 'baseYear'
  | 'companyTags'
  | 'lei'
  | 'descriptions'

/** All runnable follow-up keys; use for UI (e.g. "Re-run Scope 1", "Re-run Tags") or API validation. */
export const FOLLOW_UP_KEYS: FollowUpKey[] = [
  'industryGics',
  'scope1',
  'scope2',
  'scope1+2',
  'scope3',
  'biogenic',
  'economy',
  'goals',
  'initiatives',
  'baseYear',
  'companyTags',
  'lei',
  'descriptions',
]

class ExtractEmissionsJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    runOnly?: (FollowUpKey | 'all')[]
  }
}

const flow = new FlowProducer({ connection: redis })
flow.on('error', (err) => console.error('FlowProducer connection error:', err))

const extractEmissions = new PipelineWorker<ExtractEmissionsJob>(
  QUEUE_NAMES.EXTRACT_EMISSIONS,
  async (job) => {
    const { companyName, runOnly } = job.data
    job.sendMessage(`🤖 Fetching emissions data...`)

    // Try to get wikidata/fiscalYear from children; if not present (e.g. manual rerun),
    // fall back to values already on the job data.
    let entries: any
    try {
      entries = await job.getChildrenEntries()
    } catch {
      entries = undefined
    }

    const wikidataFromChildren =
      (entries as any)?.value?.wikidata ?? (entries as any)?.wikidata
    const fiscalYearFromChildren =
      (entries as any)?.value?.fiscalYear ?? (entries as any)?.fiscalYear

    const wikidata = wikidataFromChildren ?? (job.data as any)?.wikidata
    const fiscalYear = fiscalYearFromChildren ?? (job.data as any)?.fiscalYear

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

    const childrenJobs: { key: FollowUpKey; job: FlowChildJob }[] = [
      {
        key: 'industryGics',
        job: {
          ...base,
          name: 'industryGics ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_INDUSTRY_GICS,
        },
      },
      {
        key: 'scope1',
        job: {
          ...base,
          name: 'scope1 ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_SCOPE_1,
        },
      },
      {
        key: 'scope2',
        job: {
          ...base,
          name: 'scope2 ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_SCOPE_2,
        },
      },
      {
        key: 'scope3',
        job: {
          ...base,
          name: 'scope3 ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_SCOPE_3,
        },
      },
      {
        key: 'biogenic',
        job: {
          ...base,
          name: 'biogenic ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_BIOGENIC,
        },
      },
      {
        key: 'economy',
        job: {
          ...base,
          name: 'economy ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_ECONOMY,
        },
      },
      {
        key: 'goals',
        job: {
          ...base,
          name: 'goals ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_GOALS,
        },
      },
      {
        key: 'initiatives',
        job: {
          ...base,
          name: 'initiatives ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_INITIATIVES,
        },
      },
      {
        key: 'baseYear',
        job: {
          ...base,
          name: 'baseYear ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_BASE_YEAR,
        },
      },
      {
        key: 'companyTags',
        job: {
          ...base,
          name: 'companyTags ' + companyName,
          queueName: QUEUE_NAMES.FOLLOW_UP_COMPANY_TAGS,
        },
      },
      {
        key: 'lei',
        job: {
          ...base,
          name: 'lei ' + companyName,
          queueName: QUEUE_NAMES.EXTRACT_LEI,
          data: {
            ...base.data,
            wikidataId: base.data.wikidata.node,
          },
        },
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
          },
        },
      },
    ]

    await flow.add({
      name: companyName,
      queueName: QUEUE_NAMES.CHECK_DB,
      data: {
        ...base.data,
      },
      children: [
        ...childrenJobs
          .filter((child) => shouldRun(child.key))
          .map((child) => child.job),
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
