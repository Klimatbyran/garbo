export type PeriodWithCompanyReport = {
  year: string
  companyReport?: {
    id: string
    reportYear: string | null
    reportPublicationDate: Date | null
  } | null
}

function parseCompanyReportYear(
  reportYear: string | null | undefined
): number | null {
  const trimmed = reportYear?.trim()
  if (!trimmed || !/^\d{4}$/.test(trimmed)) return null
  return Number(trimmed)
}

/** Negative = prefer `a` over `b` (higher CompanyReport.reportYear wins). */
function preferPeriodFromNewerReport(
  a: PeriodWithCompanyReport,
  b: PeriodWithCompanyReport
): number {
  const yearA = parseCompanyReportYear(a.companyReport?.reportYear)
  const yearB = parseCompanyReportYear(b.companyReport?.reportYear)

  if (yearA !== yearB) {
    if (yearA === null) return 1
    if (yearB === null) return -1
    return yearB - yearA
  }

  const pubA = a.companyReport?.reportPublicationDate?.getTime() ?? 0
  const pubB = b.companyReport?.reportPublicationDate?.getTime() ?? 0
  if (pubA !== pubB) return pubB - pubA

  const idA = a.companyReport?.id ?? ''
  const idB = b.companyReport?.id ?? ''
  return idB.localeCompare(idA)
}

export function pickOnePeriodPerDataYear<T extends PeriodWithCompanyReport>(
  periods: T[]
): Omit<T, 'companyReport'>[] {
  const byDataYear = new Map<string, T>()

  for (const period of periods) {
    const dataYear = period.year?.trim()
    if (!dataYear) continue

    const existing = byDataYear.get(dataYear)
    if (!existing || preferPeriodFromNewerReport(period, existing) < 0) {
      byDataYear.set(dataYear, period)
    }
  }

  return Array.from(byDataYear.values()).map(
    ({ companyReport: _companyReport, ...period }) => period
  )
}
