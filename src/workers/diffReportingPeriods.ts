import { diffChanges } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import { QUEUE_NAMES } from '../queues'
import { ChangeDescription, DiffWorker, DiffJob } from '../lib/DiffWorker'
import apiConfig from '../config/api'

export class DiffReportingPeriodsJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    fiscalYear: any
    scope12?: any[]
    scope3?: any[]
    biogenic?: any[]
    economy?: any[]
    replaceAllEmissions?: boolean
  }
}

const diffReportingPeriods = new DiffWorker<DiffReportingPeriodsJob>(
  QUEUE_NAMES.DIFF_REPORTING_PERIODS,
  async (job) => {
    const {
      url,
      wikidata,
      fiscalYear,
      companyName,
      existingCompany,
      scope12 = [],
      scope3 = [],
      biogenic = [],
      economy = [],
    } = job.data

    console.log(job.isDataApproved())

    if (job.isDataApproved()) {
      job.enqueueSaveToAPI('reporting-periods', companyName, wikidata, {
        ...job.getApprovedBody(),
        ...(job.data.replaceAllEmissions && { replaceAllEmissions: true }),
      })
      return
    }

    if (!job.hasApproval()) {
      // Get all unique years from all sources
      const years = new Set([
        ...scope12.map((d) => d.year),
        ...scope3.map((d) => d.year),
        ...biogenic.map((d) => d.year),
        ...economy.map((d) => d.year),
      ])

      // Determine the report year - use the most recent year found in the data
      // This represents the year the current report actually covers
      const reportYear = years.size > 0 ? Math.max(...Array.from(years)) : null

      // Create base reporting periods
      const reportingPeriods = Array.from(years).map((year) => {
        const [startDate, endDate] = getReportingPeriodDates(
          year,
          fiscalYear.startMonth,
          fiscalYear.endMonth,
        )
        return {
          year,
          startDate,
          endDate,
          // Only assign reportURL to the reporting period that matches the report year
          reportURL:
            reportYear !== null && year === reportYear ? url : undefined,
        }
      })

      // Fill in data from each source, only keeping data that was changed.
      const updatedReportingPeriods = reportingPeriods.map(
        ({ year, ...period }) => {
          const emissions = {
            scope1: scope12.find((d) => d.year === year)?.scope1,
            scope2: scope12.find((d) => d.year === year)?.scope2,
            scope1And2: scope12.find((d) => d.year === year)?.scope1And2,
            scope3: scope3.find((d) => d.year === year)?.scope3,
            biogenic: biogenic.find((d) => d.year === year)?.biogenic,
          }

          const economyData =
            economy.find((d) => d.year === year)?.economy ?? {}

          const reportingPeriod: any = period

          if (Object.values(emissions).some((value) => value !== undefined)) {
            reportingPeriod.emissions = emissions
          }

          if (Object.values(economyData).some((value) => value !== undefined)) {
            reportingPeriod.economy = economyData
          }

          // Preserve existing reportURL for years that don't match the current report year
          if (reportYear !== null && year !== reportYear) {
            const existingPeriod = existingCompany?.reportingPeriods?.find(
              (rp: any) => rp.year === year.toString(),
            )
            if (existingPeriod?.reportURL) {
              reportingPeriod.reportURL = existingPeriod.reportURL
            }
          }

          return reportingPeriod
        },
      )

      // NOTE: Maybe only keep properties in existingCompany.reportingPeriods, e.g. the relevant economy properties, or the relevant emissions properties
      // This could improve accuracy of the diff
      const { diff, requiresApproval } = await diffChanges({
        existingCompany,
        before: existingCompany?.reportingPeriods || [],
        after: updatedReportingPeriods,
      })

      const change: ChangeDescription = {
        type: 'reportingPeriods',
        oldValue: {
          reportingPeriods: existingCompany?.reportingPeriods || [],
        },
        newValue: { reportingPeriods: updatedReportingPeriods },
      }

      await job.handleDiff(
        'reporting-periods',
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false,
      )
    }

    if (job.hasApproval() && !job.isDataApproved()) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    }
  },
)

export default diffReportingPeriods
