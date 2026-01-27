import { companyService } from './companyService'
import { regionalService } from './regionalService'
import { municipalityService } from './municipalityService'

export type EntityType = 'companies' | 'regions' | 'municipalities'

export type KpiName =
  | 'calculatedTotalEmissions'
  | 'futureEmissionsTrendSlope'
  | 'emissionsChangeAbsolute'
  | 'emissionsChangeAdjusted'
  | 'historicalEmissionChangePercent'
  | 'totalTrend'
  | 'totalCarbonLaw'
  | 'procurementScore'
  | 'bicycleMetrePerCapita'
  | 'latestEmissions'

export interface TopListItem {
  name: string
  value: number | null
  identifier?: string // wikidataId for companies, name for others
}

/**
 * Get the latest emissions value from a company's reporting periods
 */
function getLatestCompanyEmissions(company: any): number | null {
  if (!company.reportingPeriods || company.reportingPeriods.length === 0) {
    return null
  }

  // Get the most recent reporting period
  const latestPeriod = company.reportingPeriods[0]
  return latestPeriod.emissions?.calculatedTotalEmissions ?? null
}

/**
 * Get the latest emissions value from yearly data array
 */
function getLatestEmissionsFromYearlyData(
  yearlyData: Array<{ year: string; value: number } | null>,
): number | null {
  if (!yearlyData || yearlyData.length === 0) {
    return null
  }

  // Filter out null values and get the most recent
  const validData = yearlyData.filter(
    (item): item is { year: string; value: number } => item !== null,
  )

  if (validData.length === 0) {
    return null
  }

  // Sort by year descending and get the latest
  const sorted = validData.sort((a, b) => parseInt(b.year) - parseInt(a.year))
  return sorted[0].value
}

/**
 * Extract KPI value from a company entity
 */
function getCompanyKpiValue(company: any, kpi: KpiName): number | null {
  switch (kpi) {
    case 'calculatedTotalEmissions':
      return getLatestCompanyEmissions(company)
    case 'futureEmissionsTrendSlope':
      return company.futureEmissionsTrendSlope ?? null
    case 'emissionsChangeAbsolute':
      if (
        company.reportingPeriods &&
        company.reportingPeriods.length > 0 &&
        company.reportingPeriods[0].emissionsChangeLastTwoYears
      ) {
        return company.reportingPeriods[0].emissionsChangeLastTwoYears.absolute
      }
      return null
    case 'emissionsChangeAdjusted':
      if (
        company.reportingPeriods &&
        company.reportingPeriods.length > 0 &&
        company.reportingPeriods[0].emissionsChangeLastTwoYears
      ) {
        return company.reportingPeriods[0].emissionsChangeLastTwoYears.adjusted
      }
      return null
    default:
      return null
  }
}

/**
 * Extract KPI value from a region entity
 */
function getRegionKpiValue(region: any, kpi: KpiName): number | null {
  switch (kpi) {
    case 'historicalEmissionChangePercent':
      return region.historicalEmissionChangePercent ?? null
    case 'totalTrend':
      return region.totalTrend ?? null
    case 'totalCarbonLaw':
      return region.totalCarbonLaw ?? null
    case 'latestEmissions':
      return getLatestEmissionsFromYearlyData(region.emissions)
    default:
      return null
  }
}

/**
 * Extract KPI value from a municipality entity
 */
function getMunicipalityKpiValue(municipality: any, kpi: KpiName): number | null {
  switch (kpi) {
    case 'historicalEmissionChangePercent':
      return municipality.historicalEmissionChangePercent ?? null
    case 'totalTrend':
      return municipality.totalTrend ?? null
    case 'totalCarbonLaw':
      return municipality.totalCarbonLaw ?? null
    case 'procurementScore':
      return municipality.procurementScore ?? null
    case 'bicycleMetrePerCapita':
      return municipality.bicycleMetrePerCapita ?? null
    case 'latestEmissions':
      return getLatestEmissionsFromYearlyData(municipality.emissions)
    default:
      return null
  }
}

/**
 * Get top 5 entities for a specific KPI
 */
export async function getTop5Entities(
  entityType: EntityType,
  kpi: KpiName,
  order: 'asc' | 'desc' = 'desc',
): Promise<TopListItem[]> {
  let entities: any[]
  let getName: (entity: any) => string
  let getIdentifier: (entity: any) => string | undefined
  let getKpiValue: (entity: any, kpi: KpiName) => number | null

  switch (entityType) {
    case 'companies':
      entities = await companyService.getAllCompaniesWithMetadata()
      getName = (entity) => entity.name
      getIdentifier = (entity) => entity.wikidataId
      getKpiValue = getCompanyKpiValue
      break
    case 'regions':
      entities = regionalService.getRegions()
      getName = (entity) => entity.region
      getIdentifier = (entity) => entity.region
      getKpiValue = getRegionKpiValue
      break
    case 'municipalities':
      entities = municipalityService.getMunicipalities()
      getName = (entity) => entity.name
      getIdentifier = (entity) => entity.name
      getKpiValue = getMunicipalityKpiValue
      break
    default:
      throw new Error(`Unsupported entity type: ${entityType}`)
  }

  // Map entities to TopListItem with KPI values
  const items: TopListItem[] = entities
    .map((entity) => {
      const value = getKpiValue(entity, kpi)
      return {
        name: getName(entity),
        value,
        identifier: getIdentifier(entity),
      }
    })
    // Filter out entities with null values
    .filter((item) => item.value !== null)

  // Sort by value
  items.sort((a, b) => {
    if (a.value === null || b.value === null) {
      return 0
    }
    return order === 'desc' ? b.value - a.value : a.value - b.value
  })

  // Return top 5
  return items.slice(0, 5)
}
