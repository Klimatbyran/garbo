import { format } from 'date-fns'
/**
 * Translate the reporting period dates into another year. Can handle leap years.
 */
export function getPeriodDatesForYear(
  endYear: number,
  startDate: Date,
  endDate: Date
) {
  // Handle broken reporting periods
  const diff = endDate.getFullYear() - startDate.getFullYear()

  const start = new Date(
    `${endYear - diff}-${(startDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-01`
  )
  const end = new Date(
    `${endYear}-${(endDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${getLastDayInMonth(endYear, endDate.getMonth())}`
  )

  return [start, end]
}

export function getReportingPeriodDates(
  year: number,
  startMonth: number,
  endMonth: number
) {
  const startYear = startMonth > endMonth ? year - 1 : year
  const endYear = year

  const start = format(new Date(startYear, startMonth - 1, 1), 'yyyy-MM-dd')
  const end = format(
    new Date(endYear, endMonth - 1, getLastDayInMonth(endYear, endMonth - 1)),
    'yyyy-MM-dd'
  )

  console.log(`DEBUG: startYear=${startYear}, endYear=${endYear}`)
  console.log(`DEBUG: start=${start}, end=${end}`)

  return [start, end]
}

/**
 * NOTE: Month is 0-indexed like Date.getMonth()
 *
 * Credit: https://stackoverflow.com/a/5301829
 */
function getLastDayInMonth(year: number, month: number) {
  return 32 - new Date(year, month, 32).getDate()
}
