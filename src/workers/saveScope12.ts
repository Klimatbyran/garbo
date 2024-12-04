import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { defaultMetadata } from '../lib/saveUtils'
import redis from '../config/redis'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    fiscalYear: any
    scope12?: any[]
  }
}

const saveScope12 = new DiscordWorker<JobData>(
  'saveScope12',
  async (job) => {
    const { url, fiscalYear, wikidata, scope12 = [] } = job.data
    const wikidataId = wikidata.node
    const metadata = defaultMetadata(url)

    if (scope12?.length) {
      job.editMessage(`🤖 Sparar utsläppsdata scope 1+2...`)
      return Promise.all(
        scope12.map(async ({ year, scope1, scope2 }) => {
          const [startDate, endDate] = getReportingPeriodDates(
            year,
            fiscalYear.startMonth,
            fiscalYear.endMonth
          )
          job.log(`Saving scope1 and scope2 for ${startDate}-${endDate}`)
          job.sendMessage(`🤖 Sparar utsläppsdata scope 1+2 för ${year}...`)
          const body = {
            startDate,
            endDate,
            emissions: {
              scope1,
              scope2,
            },
            metadata,
          }
          return await apiFetch(`/companies/${wikidataId}/${year}/emissions`, {
            body,
          })
        })
      )
    }
    return null
  }
)

export default saveScope12
