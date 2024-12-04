import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import discord from '../discord'
import redis from '../config/redis'
import { askPrompt } from '../lib/openai'
import { formatAsReportingPeriods } from '../lib/saveUtils'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    apiSubEndpoint: string
    companyName?: string
    wikidata: any
    fiscalYear: any
    scope12?: any
    scope3?: any
    biogenic?: any
    industry?: any
    economy?: any
    goals?: any
    initiatives?: any
    approved?: boolean
  }
}

const ONE_DAY = 1000 * 60 * 60 * 24


const saveToAPI = new DiscordWorker<JobData>(
  'saveToAPI',
  async (job) => {
    const {
      apiSubEndpoint = 'general',
      companyName,
      url,
      fiscalYear,
      wikidata,
      scope12 = [],
      scope3 = [],
      biogenic = [],
      economy = [],
      goals,
      initiatives,
      industry,
      approved = false,
    } = job.data

    job.sendMessage(`🤖 sparar ${companyName}.${apiSubEndpoint} till API...`)
    const wikidataId = wikidata.node
    const existingCompany = await apiFetch(`/companies/${wikidataId}`).catch(
      () => null
    )


    // Queue the appropriate specialized worker based on the data
    if (scope12?.length || scope3?.length || biogenic?.length) {
      return await job.queueChild('saveEmissions', {
        scope12,
        scope3,
        biogenic,
      })
    }

    if (industry) {
      job.editMessage(`🤖 Sparar GICS industri...`)
      return await apiFetch(`/companies/${wikidataId}/industry`, {
        body: {
          industry,
          metadata: defaultMetadata(url),
        },
        method: 'PUT',
      })
    }

    if (goals) {
      return await job.queueChild('saveGoals', { goals })
    }

    if (initiatives) {
      return await job.queueChild('saveInitiatives', { initiatives })
    }

    if (economy?.length) {
      return await job.queueChild('saveEconomy', { economy })
    }

    throw new Error('No data to save')
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default saveToAPI
