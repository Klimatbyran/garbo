const CARBON_LAW_REDUCTION_RATE = 0.1172

export type CompanyForKpiCalculation = {
  wikidataId: string
  name: string
  futureEmissionsTrendSlope: number | null
  baseYear?: { year?: number } | null
  industry?: {
    industryGics?: {
      sectorCode?: string | null
    } | null
  } | null
  reportingPeriods?: Array<{
    startDate: string | Date
    endDate: string | Date
    emissions?: {
      calculatedTotalEmissions?: number | null
    } | null
  }>
}

export type CompanyKpi = {
  wikidataId: string
  name: string
  sectorCode: string | null
  meetsParis: boolean | null
  emissionsChangeFromBaseYear: number | null
}

function getYearFromDate(date: string | Date): number {
  return new Date(date).getFullYear()
}

function comparePeriodEndDates(
  a: { endDate: string | Date },
  b: { endDate: string | Date }
): number {
  return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
}

function get2025Emissions(
  company: CompanyForKpiCalculation,
  slope: number
): number | null {
  const actual2025Data = company.reportingPeriods?.find(
    (period) => getYearFromDate(period.endDate) === 2025
  )

  if (actual2025Data?.emissions?.calculatedTotalEmissions != null) {
    return actual2025Data.emissions.calculatedTotalEmissions
  }

  const data = (company.reportingPeriods ?? [])
    .filter(
      (period) =>
        period.emissions?.calculatedTotalEmissions !== null &&
        period.emissions?.calculatedTotalEmissions !== undefined
    )
    .map((period) => ({
      year: getYearFromDate(period.endDate),
      total: period.emissions!.calculatedTotalEmissions!,
    }))
    .sort((a, b) => a.year - b.year)

  if (data.length === 0) {
    return null
  }

  const lastDataPoint = data[data.length - 1]
  const intercept = lastDataPoint.total - slope * lastDataPoint.year
  return slope * 2025 + intercept
}

export function calculateCumulativeEmissions(
  startEmissions: number,
  slope: number,
  startYear: number,
  endYear: number
): number {
  let cumulative = 0
  for (let year = startYear; year <= endYear; year++) {
    const emissions = slope * year + (startEmissions - slope * startYear)
    cumulative += Math.max(0, emissions)
  }
  return cumulative
}

export function calculateCarbonLawCumulativeEmissions(
  startEmissions: number,
  startYear: number,
  endYear: number
): number {
  let cumulative = 0
  let currentEmissions = startEmissions

  for (let year = startYear; year <= endYear; year++) {
    cumulative += currentEmissions
    currentEmissions *= 1 - CARBON_LAW_REDUCTION_RATE
  }

  return cumulative
}

export function calculateMeetsParis(
  company: CompanyForKpiCalculation
): boolean | null {
  const slope = company.futureEmissionsTrendSlope
  if (slope === null || slope === undefined) {
    return null
  }

  const emissions2025 = get2025Emissions(company, slope)
  if (emissions2025 === null || emissions2025 === undefined) {
    return false
  }

  if (emissions2025 <= 0) {
    return true
  }

  const companyCumulativeEmissions = calculateCumulativeEmissions(
    emissions2025,
    slope,
    2025,
    2050
  )

  const carbonLawCumulativeEmissions = calculateCarbonLawCumulativeEmissions(
    emissions2025,
    2025,
    2050
  )

  return companyCumulativeEmissions <= carbonLawCumulativeEmissions
}

export function calculateEmissionsChangeFromBaseYear(
  company: CompanyForKpiCalculation
): number | null {
  if (!company.reportingPeriods || company.reportingPeriods.length === 0) {
    return null
  }

  if (!company.baseYear?.year) {
    return null
  }

  const baseYear = company.baseYear.year.toString()

  const baselinePeriod = company.reportingPeriods.find(
    (period) => getYearFromDate(period.endDate).toString() === baseYear
  )

  if (!baselinePeriod) {
    return null
  }

  const baselineEmissions =
    baselinePeriod.emissions?.calculatedTotalEmissions ?? null

  if (
    baselineEmissions === null ||
    baselineEmissions === undefined ||
    baselineEmissions === 0
  ) {
    return null
  }

  let latestPeriod: (typeof company.reportingPeriods)[number] | null = null
  for (const period of company.reportingPeriods) {
    const emissions = period.emissions?.calculatedTotalEmissions ?? null
    if (emissions === null || emissions <= 0) continue
    if (getYearFromDate(period.endDate).toString() === baseYear) continue

    if (
      latestPeriod === null ||
      comparePeriodEndDates(period, latestPeriod) > 0
    ) {
      latestPeriod = period
    }
  }

  if (!latestPeriod) {
    return null
  }

  const latestYear = getYearFromDate(latestPeriod.endDate).toString()
  if (latestYear === baseYear) {
    return null
  }

  const latestEmissions = latestPeriod.emissions?.calculatedTotalEmissions ?? 0
  const changePercent =
    ((latestEmissions - baselineEmissions) / baselineEmissions) * 100

  if (Math.abs(changePercent) > 200) {
    return null
  }

  return changePercent
}

export function calculateCompanyKpi(
  company: CompanyForKpiCalculation
): CompanyKpi {
  return {
    wikidataId: company.wikidataId,
    name: company.name,
    sectorCode: company.industry?.industryGics?.sectorCode ?? null,
    meetsParis: calculateMeetsParis(company),
    emissionsChangeFromBaseYear: calculateEmissionsChangeFromBaseYear(company),
  }
}
