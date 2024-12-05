import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import saveToAPI from './saveToAPI'

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
  'diffReportingPeriods',
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

        const economyData = {
          ...(economy.find((d) => d.year === year)?.economy ? economy : {}),
        }

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

    // NOTE: Maybe only keep properties in existingCompany.reportingPeriods, e.g. the relevant economy properties, or the relevant emissions properties
    // This could improve accuracy of the diff
    const diff = await askDiff(
      existingCompany?.reportingPeriods,
      updatedReportingPeriods
    )
    job.log('diff: ' + diff)
    const requiresApproval = diff && !diff.includes('NO_CHANGES')

    const body = {
      reportingPeriods: updatedReportingPeriods,
      metadata,
    }

    await saveToAPI.queue.add(companyName + ' reporting-periods', {
      data: {
        ...job.data,
        body,
        diff,
        apiSubEndpoint: 'reporting-periods',
        requiresApproval,
      },
    })

    return { body, diff, requiresApproval }
  }
)

export default diffReportingPeriods
