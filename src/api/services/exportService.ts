import * as fs from 'fs'
import * as path from 'path'
import { prisma } from '../../lib/prisma'
import { companyExportArgs } from '../args'
import { municipalityService } from './municipalityService'
import { regionalService } from './regionalService'
import { RegionalData } from '../types'
import ExcelJS from 'exceljs'

const EXPORT_FOLDER_PATH = './public/exports'

type ExportResult = { content: string | Buffer; name: string }
type CsvRow = { [key: string]: string | number | boolean | null }
type ExportType = 'json' | 'csv' | 'xlsx'

class FileHelper {
  static ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  static isFileOutdated(filePath: string, maxAgeMs: number): boolean {
    if (!fs.existsSync(filePath)) return true
    const lastModified = fs.statSync(filePath).mtime.getTime()
    return Date.now() - lastModified > maxAgeMs
  }
}

class ExportService {
  async exportCompanies(
    type: ExportType = 'json',
    year?: number,
  ): Promise<ExportResult> {
    const fileName = this.getFileName('company', type, year)
    const existingFile = await this.getValidExport(fileName)
    if (existingFile) return existingFile

    const companies: Company[] = await prisma.company.findMany(
      companyExportArgs(year),
    )

    console.log(type)

    const content =
      type === 'json'
        ? JSON.stringify(companies)
        : type === 'csv'
          ? this.generateCSV(this.transformCompaniesToRows(companies))
          : await this.generateXLSX(this.transformCompaniesToRows(companies))

    return this.createExportFile(fileName, content)
  }

  async exportMunicipalities(type: ExportType = 'json'): Promise<ExportResult> {
    const fileName = this.getFileName('municipality', type)
    const existingFile = await this.getValidExport(fileName)
    if (existingFile) return existingFile

    const municipalities: Municipality[] =
      await municipalityService.getMunicipalities()

    const content =
      type === 'json'
        ? JSON.stringify(municipalities)
        : type === 'csv'
          ? this.generateCSV(
              this.transformMunicipalitiesIntoRows(municipalities),
            )
          : await this.generateXLSX(
              this.transformMunicipalitiesIntoRows(municipalities),
            )

    return this.createExportFile(fileName, content)
  }

  async exportRegions(type: ExportType = 'json'): Promise<ExportResult> {
    const fileName = this.getFileName('region', type)
    const existingFile = await this.getValidExport(fileName)
    if (existingFile) return existingFile

    const regions = await regionalService.getRegions()

    const content =
      type === 'json'
        ? JSON.stringify(regions)
        : type === 'csv'
          ? this.generateCSV(this.transformRegionsIntoRows(regions))
          : await this.generateXLSX(this.transformRegionsIntoRows(regions))

    return this.createExportFile(fileName, content)
  }

  private async getValidExport(
    fileName: string,
  ): Promise<ExportResult | undefined> {
    FileHelper.ensureDirectoryExists(EXPORT_FOLDER_PATH)
    const filePath = path.join(EXPORT_FOLDER_PATH, fileName)

    const SIX_MONTHS_MS = 182.5 * 24 * 60 * 60 * 1000
    if (!FileHelper.isFileOutdated(filePath, SIX_MONTHS_MS)) {
      return { name: fileName, content: fs.readFileSync(filePath) }
    }
  }

  private async createExportFile(
    fileName: string,
    content: string | Buffer,
  ): Promise<ExportResult> {
    FileHelper.ensureDirectoryExists(EXPORT_FOLDER_PATH)
    const filePath = path.join(EXPORT_FOLDER_PATH, fileName)
    const encoding = typeof content === 'string' ? 'utf8' : 'binary'
    fs.writeFileSync(filePath, content, encoding)
    return { name: fileName, content }
  }

  private transformCompaniesToRows(companies: Company[]): CsvRow[] {
    return companies.flatMap((company) =>
      company.reportingPeriods.map((period) =>
        this.transformCompanyPeriodToRow(company, period),
      ),
    )
  }

  private transformCompanyPeriodToRow(
    company: Company,
    period: ReportingPeriod,
  ): CsvRow {
    const { scope1, scope2, scope3Categories, statedTotalEmissions } =
      this.transformEmissions(period.emissions ?? {})

    return {
      wikidataId: company.wikidataId,
      name: company.name,
      description: company.description,
      tags: company.tags?.join(', '),
      sectorCode: company.industry?.industryGics.sectorCode || null,
      groupCode: company.industry?.industryGics.groupCode || null,
      industryCode: company.industry?.industryGics.industryCode || null,
      subIndustryCode: company.industry?.industryGics.subIndustryCode || null,
      startDate: period.startDate?.toISOString() || null,
      endDate: period.endDate?.toISOString() || null,
      reportURL: period.reportURL || null,
      turnoverValue: period.economy?.turnover?.value || null,
      turnoverCurrency: period.economy?.turnover?.currency || null,
      employeesValue: period.economy?.employees?.value || null,
      employeesUnit: period.economy?.employees?.unit || null,
      ...scope1,
      ...scope2,
      ...scope3Categories,
      statedTotalEmissions,
    }
  }

  private transformEmissions(emissions: Emissions) {
    const scope1 = {
      scope1Total: emissions.scope1?.total || null,
      scope1Unit: emissions.scope1?.unit || null,
    }
    const scope2 = {
      scope2LB: emissions.scope2?.lb || null,
      scope2MB: emissions.scope2?.mb || null,
      scope2Unknown: emissions.scope2?.unknown || null,
      scope2Unit: emissions.scope2?.unit || null,
    }

    const scope3Categories: {
      [key: `scope3${string}Total`]: number | null
      [key: `scope3${string}Unit`]: number | null
    } = {}

    for (let i = 0; i < Scope3CategoryNames.length; i++) {
      scope3Categories['scope3' + Scope3CategoryNames[i] + 'Total'] =
        emissions.scope3?.categories?.find((cat) => cat.category === i + 1)
          ?.total || null
      scope3Categories['scope3' + Scope3CategoryNames[i] + 'Unit'] =
        emissions.scope3?.categories?.find((cat) => cat.category === i + 1)
          ?.unit || null
    }

    const statedTotalEmissions = emissions.statedTotalEmissions?.total || null

    return { scope1, scope2, scope3Categories, statedTotalEmissions }
  }

  private transformMunicipalitiesIntoRows(
    municipalities: Municipality[],
  ): CsvRow[] {
    const csvRows: CsvRow[] = []

    for (const municipality of municipalities) {
      csvRows.push({
        name: municipality.name,
        region: municipality.region,
        totalTrend: municipality.totalTrend,
        totalCarbonLaw: municipality.totalCarbonLaw,
        logoUrl: municipality.logoUrl,
        historicalEmissionChangePercent:
          municipality.historicalEmissionChangePercent,
        electricCarChangePercent: municipality.electricCarChangePercent,
        climatePlanLink: municipality.climatePlanLink ?? '',
        climatePlanYear: municipality.climatePlanYear ?? '',
        climatePlanComment: municipality.climatePlanComment ?? '',
        bicycleMetrePerCapita: municipality.bicycleMetrePerCapita,
        totalConsumptionEmission: municipality.totalConsumptionEmission,
        electricVehiclePerChargePoints:
          municipality.electricVehiclePerChargePoints,
        procurementScore: municipality.procurementScore,
        procurementLink: municipality.procurementLink,
        politicalRule: municipality.politicalRule
          ? municipality.politicalRule.join(', ')
          : '',
        politicalKSO: municipality.politicalKSO || '', // Ensure it's a string
        ...this.transformYearlyData(municipality.emissions, 'emissions'),
        ...this.transformYearlyData(
          municipality.approximatedHistoricalEmission,
          'approximatedHistoricalEmission',
        ),
        ...this.transformYearlyData(municipality.trend, 'trend'),
      })
    }

    return csvRows
  }

  private transformRegionsIntoRows(regions: RegionalData[]): CsvRow[] {
    const csvRows: CsvRow[] = []

    for (const region of regions) {
      // Add yearly data for each year in the regional data
      for (const [year, totalEmissions] of Object.entries(region.emissions)) {
        csvRows.push({
          name: region.name,
          year: year,
          total_emissions: totalEmissions,
        })
      }
    }

    return csvRows
  }

  private flattenSectorData(
    sectorData: Record<string, unknown>,
    prefix: string,
  ): CsvRow {
    const flattened: CsvRow = {}
    for (const [sectorName, sectorValue] of Object.entries(sectorData)) {
      if (typeof sectorValue === 'object' && sectorValue !== null) {
        // Handle nested subsector data
        for (const [subName, subValue] of Object.entries(sectorValue)) {
          flattened[`${prefix}_${sectorName}_${subName}`] =
            (subValue as number) || 0
        }
      } else {
        flattened[`${prefix}_${sectorName}`] = (sectorValue as number) || 0
      }
    }
    return flattened
  }

  private transformYearlyData(yearlyData: YearlyData[], type: string) {
    const subCsvRow: CsvRow = {}
    for (const yearlyDatapoint of yearlyData) {
      if (yearlyDatapoint)
        subCsvRow[type + yearlyDatapoint.year] = yearlyDatapoint.value
    }
    return subCsvRow
  }

  private async generateXLSX(data: CsvRow[]): Promise<Buffer> {
    if (data.length === 0) throw new Error('No data to export')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data')

    const headers = Array.from(new Set(data.flatMap((row) => Object.keys(row))))
    worksheet.addRow(headers)

    const rows = data.map((row) =>
      headers.map((header) => {
        const value = row[header]
        return value ?? ''
      }),
    )

    for (const row of rows) {
      worksheet.addRow(row)
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return Buffer.from(buffer)
  }

  private generateCSV(data: CsvRow[]): string {
    if (data.length === 0) throw new Error('No data to export')

    const headers = Array.from(new Set(data.flatMap((row) => Object.keys(row))))

    const rows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : (value ?? '')
        })
        .join(','),
    )

    return [headers.join(','), ...rows].join('\n')
  }

  private getFileName(
    type: 'company' | 'municipality' | 'region',
    ext: 'csv' | 'json' | 'xlsx',
    year?: number,
  ): string {
    return `${type}${year ? `-${year}` : ''}.${ext}`
  }
}

interface Economy {
  turnover?: { value: number | null; currency: string | null }
  employees?: { value: number | null; unit: string | null }
}

interface Scope1Emissions {
  total?: number | null
  unit?: string | null
}

interface Scope2Emissions {
  lb?: number | null
  mb?: number | null
  unknown?: number | null
  unit?: string | null
}

interface Scope3Category {
  category: number
  total: number | null
  unit: string | null
}

interface Scope3Emissions {
  categories: Scope3Category[]
  statedTotalEmissions?: { total?: number | null; unit?: string | null }
}

interface StatedTotalEmissions {
  total?: number | null
  unit?: string | null
}

interface Emissions {
  scope1?: Scope1Emissions
  scope2?: Scope2Emissions
  scope3?: Scope3Emissions
  statedTotalEmissions?: StatedTotalEmissions
}

interface ReportingPeriod {
  startDate: Date | null
  endDate: Date | null
  reportURL: string | null
  economy?: Economy
  emissions?: Emissions
}

interface Industry {
  sectorCode?: string | null
  groupCode?: string | null
  industryCode?: string | null
  subIndustryCode?: string | null
}

interface Company {
  wikidataId: string
  name: string
  description: string | null
  tags: string[]
  industry?: {
    industryGics: Industry
  } | null
  reportingPeriods: ReportingPeriod[]
}

export type YearlyData = { year: string; value: number } | null

export interface Municipality {
  name: string
  region: string
  logoUrl: string | null
  emissions: YearlyData[] // List of yearly emissions data
  totalTrend: number // Sum of future trend of emissions
  totalCarbonLaw: number // Sum of future carbon law of emissions
  approximatedHistoricalEmission: YearlyData[] // List of historical emission approximations
  trend: YearlyData[] // List of yearly emissions trend data
  historicalEmissionChangePercent: number // Change in historical emissions percentage
  electricCarChangePercent: number // Percentage change in electric cars
  climatePlanLink: string | null // Link to the climate plan (nullable)
  climatePlanYear: number | null // Climate plan year (nullable)
  climatePlanComment: string | null // Comment about the climate plan (nullable)
  bicycleMetrePerCapita: number // Bicycle infrastructure meters per capita
  totalConsumptionEmission: number // Total emissions from consumption
  electricVehiclePerChargePoints: number | null // Ratio of electric vehicles per charge points
  procurementScore: number // Procurement score
  procurementLink: string | null // Link to procurement-related information
  politicalRule: string[] // Political parties in power
  politicalKSO: string // Political party of the municipal board chairman
}

const Scope3CategoryNames = [
  'PurchasedGoods',
  'CapitalGoods',
  'FuelAndEnergyRelatedActivities',
  'UpstreamTransportationAndDistribution',
  'WasteGeneratedInOperations',
  'BusinessTravel',
  'EmployeeCommuting',
  'UpstreamLeased Assets',
  'DownstreamTransportationAndDistribution',
  'ProcessingOfSoldProducts',
  'UseOfSoldProducts',
  'EndOfLifeTreatmentOfSoldProducts',
  'DownstreamLeasedAssets',
  'Franchises',
  'Investments',
  'Other',
]

export const exportService = new ExportService()
