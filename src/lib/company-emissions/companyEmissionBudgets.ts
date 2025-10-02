const END_YEAR = 2050

export function sumOfTotalFutureTrendEmissions(
  emissionsSlope: number,
  lastReportedEmisssions: number,
  lastReportedYear: number,
  currentYear: number,
): number {
  const emissionAtStart =
    lastReportedEmisssions + emissionsSlope * (currentYear - lastReportedYear)
  const emissionAtEnd =
    lastReportedEmisssions + emissionsSlope * (END_YEAR - lastReportedYear)

  const numberOfYears = END_YEAR - currentYear + 1

  return (numberOfYears / 2) * (emissionAtStart + emissionAtEnd)
}

export function sumOfTotalCarbonLawPath() {}

export function calculateFutureTrendPathExceedsCarbonLawPath() {}
