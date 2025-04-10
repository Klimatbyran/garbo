import * as fs from 'fs';
import * as path from 'path';
import { prisma } from "../../lib/prisma"
import { companyExportArgs } from "../args"

const EXPORT_FOLDER_PATH = "../../../public/exports";

type ExportResult = { content: string; name: string };
type CsvCompanyRow = { [key: string]: string | number | null };

class FileHelper {
    static ensureDirectoryExists(dir: string): void {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    static isFileOutdated(filePath: string, maxAgeMs: number): boolean {
        if (!fs.existsSync(filePath)) return true;
        const lastModified = fs.statSync(filePath).mtime.getTime();
        return (Date.now() - lastModified) > maxAgeMs;
    }
}

class ExportService {    
  async exportCompanies(type: 'csv' | 'json' = 'json', year?: number): Promise<ExportResult> {
    const fileName = this.getFileName('company', type, year);
    const existingFile = await this.getValidExport(fileName);
    if (existingFile) return existingFile;

    const companies: Company[] = await prisma.company.findMany(companyExportArgs(year));

    const transformed = this.transformCompaniesToRows(companies);
    const content = type === 'json' ? JSON.stringify(transformed) : this.generateCSV(transformed);

    return this.createExportFile(fileName, content);
  }

  private async getValidExport(fileName: string): Promise<ExportResult | undefined> {
    FileHelper.ensureDirectoryExists(EXPORT_FOLDER_PATH);
    const filePath = path.join(EXPORT_FOLDER_PATH, fileName);

    const SIX_MONTHS_MS = 182.5 * 24 * 60 * 60 * 1000;
    if (!FileHelper.isFileOutdated(filePath, SIX_MONTHS_MS)) {
        return { name: fileName, content: fs.readFileSync(filePath, 'utf8') };
    }
  }

  private async createExportFile(fileName: string, content: string): Promise<ExportResult> {
    FileHelper.ensureDirectoryExists(EXPORT_FOLDER_PATH);
    const filePath = path.join(EXPORT_FOLDER_PATH, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    return { name: fileName, content };
  }

  private transformCompaniesToRows(companies: Company[]): CsvCompanyRow[] {
    return companies.flatMap((company) =>
        company.reportingPeriods.map((period) => this.transformCompanyPeriodToRow(company, period))
    );
  }

  private transformCompanyPeriodToRow(company: Company, period: ReportingPeriod): CsvCompanyRow {
    const { scope1, scope2, scope3Categories, statedTotalEmissions } = this.transformEmissions(period.emissions ?? {});

    return {
        wikidataId: company.wikidataId,
        name: company.name,
        description: company.description,
        tags: company.tags?.join(", "),
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
    };
  }

  private transformEmissions(emissions: Emissions) {
    const scope1 = { scope1Total: emissions.scope1?.total || null, scope1Unit: emissions.scope1?.unit || null };
    const scope2 = {
        scope2LB: emissions.scope2?.lb || null,
        scope2MB: emissions.scope2?.mb || null,
        scope2Unknown: emissions.scope2?.unknown || null,
        scope2Unit: emissions.scope2?.unit || null,
    };

    const scope3Categories: {
      [key: `scope3${string}Total`]: number | null,
      [key: `scope3${string}Unit`]: number | null
    } = {};

    for(let i = 1; i <= 16; i++) {
      scope3Categories["scope3" + Scope3CategoryNames[i] + "Total"] = emissions.scope3?.categories?.[i]?.total || null;
      scope3Categories["scope3" + Scope3CategoryNames[i] + "Unit"] = emissions.scope3?.categories?.[i]?.unit || null;
    }
    
    const statedTotalEmissions = emissions.statedTotalEmissions?.total || null;

    return { scope1, scope2, scope3Categories, statedTotalEmissions };
  }

  private generateCSV(data: CsvCompanyRow[]): string {
    if (data.length === 0) throw new Error('No data to export');

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
        headers.map((header) => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value || '';
        }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private getFileName(type: 'company' | 'municipality', ext: 'csv' | 'json', year?: number): string {
    return `${type}${year ? `-${year}` : ''}.${ext}`;
  }
    
}

interface Economy {
  turnover?: { value: number | null; currency: string | null };
  employees?: { value: number | null; unit: string | null };
}

interface Scope1Emissions {
  total?: number | null;
  unit?: string | null;
}

interface Scope2Emissions {
  lb?: number | null;
  mb?: number | null;
  unknown?: number | null;
  unit?: string | null;
}

interface Scope3Category {
  category: number;
  total: number | null;
  unit: string | null;
}

interface Scope3Emissions {
  categories: Scope3Category[];
  statedTotalEmissions?: { total?: number | null; unit?: string | null };
}

interface StatedTotalEmissions {
  total?: number | null;
  unit?: string | null;
}

interface Emissions {
  scope1?: Scope1Emissions;
  scope2?: Scope2Emissions;
  scope3?: Scope3Emissions;
  statedTotalEmissions?: StatedTotalEmissions;
}

interface ReportingPeriod {
  startDate: Date | null;
  endDate: Date | null;
  reportURL: string | null;
  economy?: Economy;
  emissions?: Emissions;
}

interface Industry {
  sectorCode?: string | null;
  groupCode?: string | null;
  industryCode?: string | null;
  subIndustryCode?: string | null;
}

interface Company {
  wikidataId: string;
  name: string;
  description: string | null;
  tags: string[];
  industry?: {
    industryGics: Industry
  } | null;
  reportingPeriods: ReportingPeriod[];
}

const Scope3CategoryNames = [
  "PurchasedGoods",
  "CapitalGoods",
  "FuelAndEnergyRelatedActivities",
  "UpstreamTransportationAndDistribution",
  "WasteGeneratedInOperations",
  "BusinessTravel",
  "EmployeeCommuting",
  "UpstreamLeased Assets",
  "DownstreamTransportationAndDistribution",
  "ProcessingOfSoldProducts",
  "UseOfSoldProducts",
  "EndOfLifeTreatmentOfSoldProducts",
  "DownstreamLeasedAssets",
  "Franchises",
  "Investments",
  "Other"
];

export const exportService = new ExportService()