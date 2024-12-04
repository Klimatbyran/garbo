import { getReportingPeriodDates } from './reportingPeriodDates'
import { apiFetch } from './api'

export function formatAsReportingPeriods(
  entries: { year: number }[],
  fiscalYear: { startMonth: number; endMonth: number },
  category: 'emissions' | 'economy'
) {
  return entries.map(({ year, ...data }) => {
    const [startDate, endDate] = getReportingPeriodDates(
      year,
      fiscalYear.startMonth,
      fiscalYear.endMonth
    )
    return {
      startDate,
      endDate,
      [category]:
        category === 'economy'
          ? (data as { economy: any }).economy
          : {
              ...data,
            },
    }
  })
}

export const defaultMetadata = (url: string) => ({
  source: url,
  comment: 'Parsed by Garbo AI',
})
