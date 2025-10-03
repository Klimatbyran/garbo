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
): number | null {
  const emissionAtCurrentYear = calculateEmissionAtCurrentYear(
    linearSlope,
    lastReportedEmissions,
    lastReportedYear,
    currentYear,
  )

  if (!emissionAtCurrentYear) return null

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

export function meetsParisGoal(
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

  const yearFraction = T
  const millisecondsPerYear = 365.25 * 24 * 60 * 60 * 1000 // Account for leap years
  const totalMilliseconds = yearFraction * millisecondsPerYear

  // Use UTC to avoid timezone issues
  const baseDate = new Date(Date.UTC(currentYear, 0, 1))
  const resultDate = new Date(baseDate.getTime() + totalMilliseconds)

  const truncatedDate = new Date(
    resultDate.getFullYear(),
    resultDate.getMonth(),
    resultDate.getDate(),
  )
  return truncatedDate
}
