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
      const existingCompany = await apiFetch(`/companies/${wikidataId}`).catch(() => null)
      const diff = await askDiff(existingCompany, { biogenic, fiscalYear })
      
      if (diff && !diff.includes('NO_CHANGES')) {
        const buttonRow = discord.createButtonRow(job.id!)
        await job.sendMessage({
          content: `# ${job.data.companyName}: biogenic emissions\n${diff}`.slice(0, 2000),
          components: [buttonRow],
        })
        return await job.moveToDelayed(Date.now() + ONE_DAY)
      }

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
