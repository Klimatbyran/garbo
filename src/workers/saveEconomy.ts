import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: any
    fiscalYear: any
    economy?: any[]
  }
}

const saveEconomy = new DiscordWorker<JobData>('saveEconomy', async (job) => {
  const {
    url,
    fiscalYear,
    wikidata,
    existingCompany,
    companyName,
    economy = [],
  } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  const body = await Promise.all(
    economy.map(async ({ year, economy }) => {
      const [startDate, endDate] = getReportingPeriodDates(
        year,
        fiscalYear.startMonth,
        fiscalYear.endMonth
      )
      return {
        startDate,
        endDate,
        economy,
        metadata,
      }
    })
  )

  const diff = await askDiff(existingCompany, { economy, fiscalYear })
  job.log('diff: ' + diff)
  const requiresApproval = diff && !diff.includes('NO_CHANGES')

  await saveToAPI.queue.add(companyName, {
    data: {
      ...job.data,
      body,
      diff,
      requiresApproval,
      wikidataId,
    },
  })

  return { body, diff, requiresApproval }
})

export default saveEconomy
