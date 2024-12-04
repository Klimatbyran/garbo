import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    existingCompany: any
    companyName: string
    wikidata: any
    fiscalYear: any
    biogenic?: any[]
  }
}

const saveBiogenic = new DiscordWorker<JobData>('saveBiogenic', async (job) => {
  const {
    url,
    fiscalYear,
    wikidata,
    existingCompany,
    companyName,
    biogenic = [],
  } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  const body = await Promise.all(
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
        metadata,
      }
    })
  )

  const diff = await askDiff(existingCompany, { biogenic, fiscalYear })
  const requiresApproval = diff && !diff.includes('NO_CHANGES')
  job.log('diff' + diff)
  await saveToAPI.queue.add(companyName, {
    data: {
      ...job.data,
      body,
      diff,
      requiresApproval,
      wikidataId,
    },
  })

  return null
})

export default saveBiogenic
