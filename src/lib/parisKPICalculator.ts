const CARBON_LAW_SLOPE = -0.1172
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
  emissionAtCurrentYear: number,
  currentYear: number,
): number | null {
  if (!emissionAtCurrentYear) return null

  const emissionAtEnd =
    emissionAtCurrentYear + linearSlope * (END_YEAR - currentYear)

  const numberOfYears = END_YEAR - currentYear + 1

  return (numberOfYears / 2) * (emissionAtCurrentYear + emissionAtEnd)
}

export function sumOfExponentialTrendPath(
  emissionAtCurrentYear: number,
  startYear: number,
  exponentialSlope: number = CARBON_LAW_SLOPE,
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

  const solutions = [(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)]
  const positiveSolution = solutions.filter((t) => t > 0)[0]
  if (!positiveSolution) return null

  const resultDate = new Date(Date.UTC(currentYear, 0, 1))
  resultDate.setUTCMilliseconds(
    resultDate.getUTCMilliseconds() +
      positiveSolution * 365.25 * 24 * 60 * 60 * 1000,
  )

  return new Date(
    resultDate.getFullYear(),
    resultDate.getMonth(),
    resultDate.getDate(),
  )
}
