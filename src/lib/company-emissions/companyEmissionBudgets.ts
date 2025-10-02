const END_YEAR = 2050

export function sumOfLinearTrendPath(
  linearSlope: number,
  lastReportedEmisssions: number,
  lastReportedYear: number,
  currentYear: number,
): number {
  const emissionAtStart =
    lastReportedEmisssions + linearSlope * (currentYear - lastReportedYear)
  const emissionAtEnd =
    lastReportedEmisssions + linearSlope * (END_YEAR - lastReportedYear)

  const numberOfYears = END_YEAR - currentYear + 1

  return (numberOfYears / 2) * (emissionAtStart + emissionAtEnd)
}

export function sumOfExponentialTrendPath(
  exponentialSlope: number,
  emissionAtStart: number,
  startYear: number,
): number {
  if (END_YEAR < startYear) return 0

  const r = 1 + exponentialSlope
  const n = END_YEAR - startYear + 1

  const EPS = 1e-12
  if (Math.abs(1 - r) < EPS) return emissionAtStart * n

  return (emissionAtStart * (1 - Math.pow(r, n))) / (1 - r)
}

export function calculateWhenFutureTrendExceedsCarbonLaw(
  linearSlope: number,
  emissionAtStart: number,
  carbonLawSum: number,
  currentYear: number,
): Date | null {
  const a = linearSlope / 2
  const b = emissionAtStart
  const c = -carbonLawSum

  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) return null // no solution

  const sqrtD = Math.sqrt(discriminant)

  const T1 = (-b + sqrtD) / (2 * a)
  const T2 = (-b - sqrtD) / (2 * a)

  const T = [T1, T2].filter((t) => t > 0).sort((x, y) => x - y)[0]
  if (!T) return null

  const days = Math.round(T * 365)
  const dateTrendExeedsCarbonLaw = new Date(currentYear, 0, 1)
  dateTrendExeedsCarbonLaw.setDate(dateTrendExeedsCarbonLaw.getDate() + days)

  return dateTrendExeedsCarbonLaw
}
