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
    scope3?: any[]
    biogenic?: any[]
    economy?: any[]
  }
}

const saveReportingPeriods = new DiscordWorker<JobData>('saveReportingPeriods', async (job) => {
  const { url, fiscalYear, wikidata, companyName, scope12 = [], scope3 = [], biogenic = [], economy = [] } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  const body = await Promise.all([
    ...scope12.map(async ({ year, scope1, scope2 }) => {
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
    }),
    ...scope3.map(async ({ year, scope3 }) => {
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
        metadata,
      }
    }),
    ...biogenic.map(async ({ year, biogenic }) => {
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
    }),
    ...economy.map(async ({ year, economy }) => {
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
  ])

  const diff = await askDiff(null, { scope12, scope3, biogenic, economy, fiscalYear })
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

export default saveReportingPeriods
