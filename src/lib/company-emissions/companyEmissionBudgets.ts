import { Company } from '@/types'

const END_YEAR = 2050

export function calculateEmissionAtCurrentYear(
  linearSlope: number,
  lastReportedEmissions: number,
  lastReportedYear: number,
  currentYear: number,
): number {
  return lastReportedEmissions + linearSlope * (currentYear - lastReportedYear)
}

export function sumOfLinearTrendPath(
  linearSlope: number,
  lastReportedEmissions: number,
  lastReportedYear: number,
  currentYear: number,
): number {
  const emissionAtCurrentYear = calculateEmissionAtCurrentYear(
    linearSlope,
    lastReportedEmissions,
    lastReportedYear,
    currentYear,
  )
  const emissionAtEnd =
    lastReportedEmissions + linearSlope * (END_YEAR - lastReportedYear)

  const numberOfYears = END_YEAR - currentYear + 1

  return (numberOfYears / 2) * (emissionAtCurrentYear + emissionAtEnd)
}

export function sumOfExponentialTrendPath(
  exponentialSlope: number,
  emissionAtCurrentYear: number,
  startYear: number,
): number {
  if (END_YEAR < startYear) return 0

  const r = 1 + exponentialSlope
  const n = END_YEAR - startYear + 1

  const EPS = 1e-12
  if (Math.abs(1 - r) < EPS) return emissionAtCurrentYear * n

  return (emissionAtCurrentYear * (1 - Math.pow(r, n))) / (1 - r)
}

export function meetsParisAgreement(
  sumOfLinearTrendPath: number,
  sumOfExponentialTrendPath: number,
): boolean {
  return sumOfLinearTrendPath <= sumOfExponentialTrendPath
}

export function calculateWhenFutureTrendExceedsCarbonLaw(
  linearSlope: number,
  emissionAtCurrentYear: number,
  carbonLawSum: number,
  currentYear: number,
): Date | null {
  const a = linearSlope / 2
  const b = emissionAtCurrentYear
  const c = -carbonLawSum

  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) return null // no solution

  const sqrtD = Math.sqrt(discriminant)

  const T1 = (-b + sqrtD) / (2 * a)
  const T2 = (-b - sqrtD) / (2 * a)

  const T = [T1, T2].filter((t) => t > 0).sort((x, y) => x - y)[0]
  if (!T) return null

  const days = Math.round(T * 365)
  const dateTrendExceedsCarbonLaw = new Date(currentYear, 0, 1)
  dateTrendExceedsCarbonLaw.setDate(dateTrendExceedsCarbonLaw.getDate() + days)

  return dateTrendExceedsCarbonLaw
}

export function addParisAgreement(companies: Company[]) {
  const currentYear = new Date().getFullYear()
  return companies.map((company) => {
    return {
      ...company,
      meetsParisGoal: meetsParisAgreement(
        company.futureEmissionsTrendSlope,
        company.carbonLawSum,
      ),
      // dateTrendExceedsCarbonLaw: calculateWhenFutureTrendExceedsCarbonLaw(
      //   company.futureEmissionsTrendSlope,
      //   calculateEmissionAtCurrentYear(
      //     company.futureEmissionsTrendSlope,
      //     company.reportingPeriods[0].emissions.totalCalculatedEmissions,
      //     new Date(company.reportingPeriods[0].startDate).getFullYear(),
      //     currentYear,
      //   ),
      //   company.carbonLawSum,
      //   currentYear,
      // ),
    }
  })
}
