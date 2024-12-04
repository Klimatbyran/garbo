import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    fiscalYear: any
    scope12?: any[]
  }
}

const saveScope12 = new DiscordWorker<JobData>('saveScope12', async (job) => {
  const { url, fiscalYear, wikidata, companyName, scope12 = [] } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  if (scope12?.length) {
    const data = await Promise.all(
      scope12.map(async ({ year, scope1, scope2 }) => {
        const [startDate, endDate] = getReportingPeriodDates(
          year,
          fiscalYear.startMonth,
          fiscalYear.endMonth
        )
        return {
          startDate,
          endDate,
          emissions: {
            scope1,
            scope2,
          },
          metadata,
        }
      })
    )

    const diff = await askDiff(null, { scope12, fiscalYear })
    const requiresApproval = diff && !diff.includes('NO_CHANGES')

    await saveToAPI.queue.add(companyName, {
      ...job.data,
      body: {
        data: data,
        diff: diff,
        requiresApproval,
        wikidataId,
      },
    })

    return { data, diff }
  }
  return null
})

export default saveScope12
