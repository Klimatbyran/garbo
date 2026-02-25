/**
 * Format a date according to the ISO standard, e.g. "2023-01-01"
 */
const isoDate = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short' })

/**
 * Translate the reporting period dates into another year. Can handle leap years.
 */
export function getReportingPeriodDates(
  year: number,
  startMonth: number,
  endMonth: number
) {
  const startYear = startMonth >= endMonth ? year - 1 : year
  const endYear = year

  const start = isoDate.format(new Date(startYear, startMonth - 1, 1))
  const end = isoDate.format(
    new Date(endYear, endMonth - 1, getLastDayInMonth(endYear, endMonth - 1))
  )

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
