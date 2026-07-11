const CARBON_LAW_REDUCTION_RATE = 0.1172

export interface CompanyForParisCalculation {
  reportingPeriods: Array<{
    endDate: Date | string
    emissions?: {
      calculatedTotalEmissions?: number | null
    } | null
  }>
  baseYear?: { year: number } | null
  futureEmissionsTrendSlope: number | null
}

interface TrendCoefficients {
  slope: number
  intercept: number
}

function buildTrendCoefficients(
  company: CompanyForParisCalculation
): TrendCoefficients | null {
  const slope = company.futureEmissionsTrendSlope
  if (slope === null || slope === undefined || !Number.isFinite(slope)) {
    return null
  }

  const data = company.reportingPeriods
    .filter(
      (period) =>
        period.emissions?.calculatedTotalEmissions !== null &&
        period.emissions?.calculatedTotalEmissions !== undefined
    )
    .map((period) => ({
      year: new Date(period.endDate).getFullYear(),
      total: period.emissions!.calculatedTotalEmissions!,
    }))
    .sort((a, b) => a.year - b.year)

  if (data.length === 0) {
    return null
  }

  const baseYear = company.baseYear?.year
  const dataSinceBaseYear = baseYear
    ? data.filter((point) => point.year >= baseYear)
    : data

  if (dataSinceBaseYear.length === 0) {
    return null
  }

  const lastDataPoint = dataSinceBaseYear[dataSinceBaseYear.length - 1]
  const intercept = lastDataPoint.total - slope * lastDataPoint.year

  return { slope, intercept }
}

function get2025Emissions(
  company: CompanyForParisCalculation,
  coefficients: TrendCoefficients
): number | null {
  const actual2025Data = company.reportingPeriods.find(
    (period) => new Date(period.endDate).getFullYear() === 2025
  )

  if (actual2025Data?.emissions?.calculatedTotalEmissions != null) {
    return actual2025Data.emissions.calculatedTotalEmissions
  }

  return coefficients.slope * 2025 + coefficients.intercept
}

function calculateCumulativeEmissions(
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

function calculateCarbonLawCumulativeEmissions(
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

export function calculateCompanyMeetsParis(
  company: CompanyForParisCalculation
): boolean | null {
  const coefficients = buildTrendCoefficients(company)
  if (!coefficients) {
    return null
  }

  const emissions2025 = get2025Emissions(company, coefficients)
  if (emissions2025 === null || emissions2025 === undefined) {
    return null
  }

  if (emissions2025 <= 0) {
    return true
  }

  const companyCumulativeEmissions = calculateCumulativeEmissions(
    emissions2025,
    coefficients.slope,
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

export interface CompanyParisOverviewItem {
  id: string
  wikidataId: string | null
  name: string
  meetsParis: boolean | null
  emissions: number | null
  emissionsYear: number | null
  sectorCode: string | null
  tags: string[]
}

export function toCompanyParisOverviewItem(company: {
  id: string
  wikidataId?: string | null
  name: string
  tags?: string[]
  industry?: {
    industryGics?: {
      sectorCode?: string | null
    } | null
  } | null
  reportingPeriods: CompanyForParisCalculation['reportingPeriods']
  baseYear?: { year: number } | null
  futureEmissionsTrendSlope: number | null
}): CompanyParisOverviewItem {
  const latestPeriod = [...company.reportingPeriods].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  )[0]

  const emissions =
    latestPeriod?.emissions?.calculatedTotalEmissions ?? null
  const emissionsYear = latestPeriod
    ? new Date(latestPeriod.endDate).getFullYear()
    : null

  const meetsParis =
    emissions == null || emissions <= 0
      ? null
      : calculateCompanyMeetsParis(company)

  return {
    id: company.id,
    wikidataId: company.wikidataId ?? null,
    name: company.name,
    meetsParis,
    emissions: emissions != null && emissions > 0 ? emissions : null,
    emissionsYear,
    sectorCode: company.industry?.industryGics?.sectorCode ?? null,
    tags: company.tags ?? [],
  }
}
