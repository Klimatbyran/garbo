import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import saveToAPI from './saveToAPI'
import { QUEUE_NAMES } from '../queues'

export class DiffReportingPeriodsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    fiscalYear: any
    scope12?: any[]
    scope3?: any[]
    biogenic?: any[]
    economy?: any[]
  }
}

const diffReportingPeriods = new DiscordWorker<DiffReportingPeriodsJob>(
QUEUE_NAMES.DIFF_REPORTING_PERIODS,
  async (job) => {
    const {
      url,
      fiscalYear,
      companyName,
      existingCompany,
      scope12 = [],
      scope3 = [],
      biogenic = [],
      economy = [],
    } = job.data
    const metadata = defaultMetadata(url)

    // Get all unique years from all sources
    const years = new Set([
      ...scope12.map((d) => d.year),
      ...scope3.map((d) => d.year),
      ...biogenic.map((d) => d.year),
      ...economy.map((d) => d.year),
    ])

    // Create base reporting periods
    const reportingPeriods = Array.from(years).map((year) => {
      const [startDate, endDate] = getReportingPeriodDates(
        year,
        fiscalYear.startMonth,
        fiscalYear.endMonth
      )
      return {
        year,
        startDate,
        endDate,
        reportURL: url,
      }
    })

    // Fill in data from each source, only keeping data that was changed.
    const updatedReportingPeriods = reportingPeriods.map(
      ({ year, ...period }) => {
        const emissions = {
          scope1: scope12.find((d) => d.year === year)?.scope1,
          scope2: scope12.find((d) => d.year === year)?.scope2,
          scope3: scope3.find((d) => d.year === year)?.scope3,
          biogenic: biogenic.find((d) => d.year === year)?.biogenic,
        }

        const economyData = economy.find((d) => d.year === year)?.economy ?? {}

        const reportingPeriod: any = period

        if (Object.values(emissions).some((value) => value !== undefined)) {
          reportingPeriod.emissions = emissions
        }

        if (Object.values(economyData).some((value) => value !== undefined)) {
          reportingPeriod.economy = economyData
        }

        return reportingPeriod
      }
    )

    const body = {
      reportingPeriods: updatedReportingPeriods,
      metadata,
    }

    // NOTE: Maybe only keep properties in existingCompany.reportingPeriods, e.g. the relevant economy properties, or the relevant emissions properties
    // This could improve accuracy of the diff
    const { diff, requiresApproval } = await diffChanges({
      existingCompany,
      before: existingCompany?.reportingPeriods,
      after: reportingPeriods,
    })

    job.log('Diff:' + diff)

    // Only save if we detected any meaningful changes
    if (diff) {
      await saveToAPI.queue.add(companyName + ' reporting-periods', {
        ...job.data,
        body,
        diff,
        requiresApproval,
        apiSubEndpoint: 'reporting-periods',

        // Remove duplicated job data that should be part of the body from now on
        scope12: undefined,
        scope3: undefined,
        biogenic: undefined,
        economy: undefined,
      })
    }

    return { body, diff, requiresApproval }
  }
)

export default diffReportingPeriods
