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

    if (job.isDataApproved()) {
      job.enqueueSaveToAPI(
        'reporting-periods',
        companyName,
        wikidata,
        job.getApprovedBody(),
      )
      return
    }

    if (!job.hasApproval()) {
      // Get all unique years from all sources (incoming data)
      const incomingYears = new Set(
        [
          ...scope12.map((d) => d.year),
          ...scope3.map((d) => d.year),
          ...biogenic.map((d) => d.year),
          ...economy.map((d) => d.year),
        ].filter((year) => !isNaN(year) && year != null),
      )

      // Also include years from existing reporting periods to preserve them
      const existingYears =
        existingCompany?.reportingPeriods
          ?.map((rp: any) => parseInt(rp.year))
          .filter((year: number) => !isNaN(year)) || []

      const years = new Set([...incomingYears, ...existingYears])

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
          const scope12Data = scope12.find((d) => d.year === year)
          const scope3Data = scope3.find((d) => d.year === year)
          const biogenicData = biogenic.find((d) => d.year === year)
          const economyData = economy.find((d) => d.year === year)
          const reportingPeriod: any = period

          // Only add emissions if we have actual emission data (not null/undefined)
          const hasEmissionData =
            scope12Data?.scope1 != null ||
            scope12Data?.scope2 != null ||
            scope3Data?.scope3 != null ||
            biogenicData?.biogenic !== undefined

          if (hasEmissionData) {
            reportingPeriod.emissions = {}

            if (scope12Data?.scope1 != null) {
              reportingPeriod.emissions.scope1 = scope12Data.scope1
            }
            if (scope12Data?.scope2 != null) {
              reportingPeriod.emissions.scope2 = scope12Data.scope2
            }
            if (scope3Data?.scope3 != null) {
              reportingPeriod.emissions.scope3 = scope3Data.scope3
            }
            if (biogenicData?.biogenic !== undefined) {
              reportingPeriod.emissions.biogenic = biogenicData.biogenic
            }
          }

          // Only add economy data if we have actual economy data
          if (
            economyData?.economy &&
            Object.keys(economyData.economy).length > 0
          ) {
            const hasEconomyValues = Object.values(economyData.economy).some(
              (value) => value != null && value !== '',
            )
            if (hasEconomyValues) {
              reportingPeriod.economy = economyData.economy
            }
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
        oldValue: { reportingPeriods: existingCompany?.reportingPeriods || [] },
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
