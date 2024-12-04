import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { defaultMetadata, askDiff } from '../lib/saveUtils'

const ONE_DAY = 1000 * 60 * 60 * 24
import redis from '../config/redis'
import discord from '../discord'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    fiscalYear: any
    scope3?: any[]
  }
}

const saveScope3 = new DiscordWorker<JobData>('saveScope3', async (job) => {
  const { url, fiscalYear, wikidata, scope3 = [] } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  if (scope3?.length) {
    const existingCompany = await apiFetch(`/companies/${wikidataId}`).catch(
      () => null
    )
    const diff = await askDiff(existingCompany, { scope3, fiscalYear })

    if (diff && !diff.includes('NO_CHANGES')) {
      const buttonRow = discord.createButtonRow(job.id!)
      await job.sendMessage({
        content: `# ${job.data.companyName}: scope 3 emissions\n${diff}`.slice(
          0,
          2000
        ),
        components: [buttonRow],
      })
      await job.moveToDelayed(Date.now() + ONE_DAY)
      return { diff }
    }

    job.editMessage(`🤖 Sparar utsläppsdata scope 3...`)
    return Promise.all(
      scope3.map(async ({ year, scope3 }) => {
        const [startDate, endDate] = getReportingPeriodDates(
          year,
          fiscalYear.startMonth,
          fiscalYear.endMonth
        )
        job.sendMessage(`🤖 Sparar utsläppsdata scope 3 för ${year}...`)
        job.log(`Saving scope3 for ${year}`)
        const body = {
          startDate,
          endDate,
          emissions: {
            scope3,
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
})

export default saveScope3
