import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    fiscalYear: any
    biogenic?: any[]
  }
}

const saveBiogenic = new DiscordWorker<JobData>('saveBiogenic', async (job) => {
  const { url, fiscalYear, wikidata, biogenic = [] } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  if (biogenic?.length) {
    const data = await Promise.all(
      biogenic.map(async ({ year, biogenic }) => {
        const [startDate, endDate] = getReportingPeriodDates(
          year,
          fiscalYear.startMonth,
          fiscalYear.endMonth
        )
        return {
          startDate,
          endDate,
          emissions: {
            biogenic,
          },
          metadata
        }
      })
    )

    const diff = await askDiff(null, { biogenic, fiscalYear })
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

export default saveBiogenic
