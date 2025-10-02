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

export function calculateFutureTrendPathExceedsCarbonLawPath() {}
