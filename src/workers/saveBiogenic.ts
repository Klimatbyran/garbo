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
    biogenic?: any[]
  }
}

const saveBiogenic = new DiscordWorker<JobData>(
  'saveBiogenic',
  async (job) => {
    const { url, fiscalYear, wikidata, biogenic = [] } = job.data
    const wikidataId = wikidata.node
    const metadata = defaultMetadata(url)

    if (biogenic?.length) {
      job.editMessage(`🤖 Sparar biogeniska utsläpp...`)
      return Promise.all(
        biogenic.map(async ({ year, biogenic }) => {
          const [startDate, endDate] = getReportingPeriodDates(
            year,
            fiscalYear.startMonth,
            fiscalYear.endMonth
          )
          job.sendMessage(`🤖 Sparar utsläppsdata biogenic för ${year}...`)
          job.log(`Saving biogenic for ${year}`)
          const body = {
            startDate,
            endDate,
            emissions: {
              biogenic,
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

export default saveBiogenic
