import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
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
    const data = await Promise.all(
      scope3.map(async ({ year, scope3 }) => {
        const [startDate, endDate] = getReportingPeriodDates(
          year,
          fiscalYear.startMonth,
          fiscalYear.endMonth
        )
        return {
          startDate,
          endDate,
          emissions: {
            scope3,
          },
          metadata
        }
      })
    )

    const diff = await askDiff(null, { scope3, fiscalYear })
    const requiresApproval = diff && !diff.includes('NO_CHANGES')

    await job.queue.add('api-save', {
      ...job.data,
      data: data,
      diff: diff,
      requiresApproval,
      wikidataId
    })

    return { data, diff }
  }
  return null
})

export default saveScope3
