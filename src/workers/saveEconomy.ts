import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { defaultMetadata, formatAsReportingPeriods } from '../lib/saveUtils'
import redis from '../config/redis'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    fiscalYear: any
    economy?: any[]
  }
}

const saveEconomy = new DiscordWorker<JobData>(
  'saveEconomy',
  async (job) => {
    const { url, fiscalYear, wikidata, economy = [] } = job.data
    const wikidataId = wikidata.node
    const metadata = defaultMetadata(url)

    if (economy?.length) {
      job.editMessage(`🤖 Sparar ekonomidata...`)
      return Promise.all(
        economy.map(async ({ year, economy }) => {
          const [startDate, endDate] = getReportingPeriodDates(
            year,
            fiscalYear.startMonth,
            fiscalYear.endMonth
          )
          job.log(`Saving economy for ${startDate}-${endDate}`)
          job.sendMessage(`🤖 Sparar ekonomidata för ${year}...`)
          const body = {
            startDate,
            endDate,
            economy,
            metadata,
          }

          return await apiFetch(`/companies/${wikidataId}/${year}/economy`, {
            body,
          })
        })
      )
    }

    return null
  },
  {
    connection: redis,
  }
)

export default saveEconomy
