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

  // Get all unique years from all sources
  const years = new Set([
    ...scope12.map(d => d.year),
    ...scope3.map(d => d.year),
    ...biogenic.map(d => d.year),
    ...economy.map(d => d.year)
  ])

  // Create base reporting periods
  const reportingPeriods = Array.from(years).map(year => {
    const [startDate, endDate] = getReportingPeriodDates(
      year,
      fiscalYear.startMonth,
      fiscalYear.endMonth
    )
    return {
      startDate,
      endDate,
      emissions: {},
      economy: undefined,
      metadata,
    }
  })

  // Fill in data from each source
  const body = reportingPeriods.map(period => {
    const yearData = {
      scope12: scope12.find(d => {
        const [s] = getReportingPeriodDates(d.year, fiscalYear.startMonth, fiscalYear.endMonth)
        return s === period.startDate
      }),
      scope3: scope3.find(d => {
        const [s] = getReportingPeriodDates(d.year, fiscalYear.startMonth, fiscalYear.endMonth)
        return s === period.startDate
      }),
      biogenic: biogenic.find(d => {
        const [s] = getReportingPeriodDates(d.year, fiscalYear.startMonth, fiscalYear.endMonth)
        return s === period.startDate
      }),
      economy: economy.find(d => {
        const [s] = getReportingPeriodDates(d.year, fiscalYear.startMonth, fiscalYear.endMonth)
        return s === period.startDate
      })
    }

    return {
      ...period,
      emissions: {
        ...(yearData.scope12 && {
          scope1: yearData.scope12.scope1,
          scope2: yearData.scope12.scope2
        }),
        ...(yearData.scope3 && {
          scope3: yearData.scope3.scope3
        }),
        ...(yearData.biogenic && {
          biogenic: yearData.biogenic.biogenic
        })
      },
      ...(yearData.economy && {
        economy: yearData.economy.economy
      })
    }
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
