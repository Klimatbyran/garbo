import * as fs from 'fs';
import * as path from 'path';
import { prisma } from "../../lib/prisma"
import { companyExportArgs } from "../args"

const EXPORT_FOLDER_PATH = "../../../public/exports";

type CsvCompanyRow = {
    wikidataId: string;
    name: string;
    description: string;
    tags: string;
    sectorCode: string;
    groupCode: string;
    industryCode: string;
    subIndustryCode: string;
    startDate: string | null;
    endDate: string | null;
    reportURL: string | null;
    turnoverValue: number | null;
    turnoverCurrency: string | null;
    employeesValue: number | null;
    employeesUnit: string | null;
    scope1Total: number | null;
    scope1Unit: string | null;
    scope2LB: number | null;
    scope2MB: number | null;
    scope2Unknown: number | null;
    scope2Unit: string | null;
    scope3StatedTotal: number | null;
    scope3Unit: string | null;
    statedTotalEmissions: number | null;
    statedTotalEmissionsUnit: string | null;
    purchasedGoodsTotal: number | null; // Category 1
    purchasedGoodsUnit: string | null;
    capitalGoodsTotal: number | null; // Category 2
    capitalGoodsUnit: string | null;
    fuelAndEnergyRelatedActivitiesTotal: number | null; // Category 3
    fuelAndEnergyRelatedActivitiesUnit: string | null;
    upstreamTransportationAndDistributionTotal: number | null; // Category 4
    upstreamTransportationAndDistributionUnit: string | null;
    wasteGeneratedInOperationsTotal: number | null; // Category 5
    wasteGeneratedInOperationsUnit: string | null;
    businessTravelTotal: number | null; // Category 6
    businessTravelUnit: string | null;
    employeeCommutingTotal: number | null; // Category 7
    employeeCommutingUnit: string | null;
    upstreamLeasedAssetsTotal: number | null; // Category 8
    upstreamLeasedAssetsUnit: string | null;
    downstreamTransportationAndDistributionTotal: number | null; // Category 9
    downstreamTransportationAndDistributionUnit: string | null;
    processingOfSoldProductsTotal: number | null; // Category 10
    processingOfSoldProductsUnit: string | null;
    useOfSoldProductsTotal: number | null; // Category 11
    useOfSoldProductsUnit: string | null;
    endOfLifeTreatmentOfSoldProductsTotal: number | null; // Category 12
    endOfLifeTreatmentOfSoldProductsUnit: string | null;
    downstreamLeasedAssetsTotal: number | null; // Category 13
    downstreamLeasedAssetsUnit: string | null;
    franchisesTotal: number | null; // Category 14
    franchisesUnit: string | null;
    investmentsTotal: number | null; // Category 15
    investmentsUnit: string | null;
    otherTotal: number | null; // Category 16
    otherUnit: string | null;
  };

class ExportService {
    
    async exportCompanies(type: 'csv' | 'json' = 'json', reportingPeriod?: number): Promise<{content: string, name: string}> {
        const exportFile = await this.doesValidExportExist('company', type);
        if(exportFile) {
          return exportFile;
        }

        const companies = await prisma.company.findMany(companyExportArgs(reportingPeriod));

        if(type === 'json') {
            return this.createOrUpdateExportFile('company', type, JSON.stringify(companies));
        } else {
            return this.createOrUpdateExportFile('company', type, this.toCSV(this.transformCompaniesToRows(companies)));
        }
    }

    transformCompaniesToRows(companies) {
        const rows: CsvCompanyRow[] = [];
      
        companies.forEach((company) => {
          const {
            wikidataId,
            name,
            description,
            tags,
            industry = null
          } : {
            wikidataId: string,
            name: string,
            description: string,
            tags: string[],
            industry: {
              sectorCode?,
              groupCode?,
              industryCode?,
              subIndustryCode?,
            } | null
          } = company;
      
          // Iterate over reportingPeriods to create one row per period
          company.reportingPeriods.forEach((period) => {
            if (!period) {
              return; // Safely skip null or undefined periods
            }

            const {
              startDate,
              endDate,
              reportURL,
              economy,
              emissions = {},
            } = period;

            let scope1: {
              total?: number,
              unit?: string
            } = {},
            scope2: {
              mb?: number,
              lb?: number,
              unknown?: number
              unit?: string
            } = {},
            scope3: {
              categories?: [],
              statedTotalEmissions?: {
                total?: number,
                unit?: string
              }
            } = {},
            statedTotalEmissions: {
              total?: number,
              unit?: string
            } = {};

            if(emissions) {
              scope1 = emissions.scope1 || {};
              scope2 = emissions.scope2 || {};
              scope3 = emissions.scope3 || {};
              statedTotalEmissions = emissions.statedTotalEmissions || {};
            }
            

            const scope3Categories = Array.from({ length: 16 }, (_, i) => ({
            category: i + 1, // Category indices go from 1 to 16
            total: null,
            unit: null,
            }));

            scope3?.categories?.forEach(({ category, total, unit }) => {
            if (category >= 1 && category <= 16) {
                // Correct mapping of category index to its position
                scope3Categories[category - 1] = { category, total, unit };
            }
            });
      
            const row = {
                wikidataId,
                name,
                description,
                tags: tags.join(", "), // Convert tags array to comma-separated string
                sectorCode: industry?.sectorCode || null,
                groupCode: industry?.groupCode || null,
                industryCode: industry?.industryCode || null,
                subIndustryCode: industry?.subIndustryCode || null,
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString(),
                reportURL: reportURL || null,
                turnoverValue: economy?.turnover?.value || null,
                turnoverCurrency: economy?.turnover?.currency || null,
                employeesValue: economy?.employees?.value || null,
                employeesUnit: economy?.employees?.unit || null,
                scope1Total: scope1?.total || null,
                scope1Unit: scope1?.unit || null,
                scope2LB: scope2?.lb || null,
                scope2MB: scope2?.mb || null,
                scope2Unknown: scope2?.unknown || null,
                scope2Unit: scope2?.unit || null,
                scope3StatedTotal: scope3?.statedTotalEmissions?.total || null,
                scope3Unit: scope3?.statedTotalEmissions?.unit || null,
                statedTotalEmissions: statedTotalEmissions?.total || null,
                statedTotalEmissionsUnit: statedTotalEmissions?.unit || null,
                purchasedGoodsTotal: scope3Categories[0].total,
                purchasedGoodsUnit: scope3Categories[0].unit,
                capitalGoodsTotal: scope3Categories[1].total,
                capitalGoodsUnit: scope3Categories[1].unit,
                fuelAndEnergyRelatedActivitiesTotal: scope3Categories[2].total,
                fuelAndEnergyRelatedActivitiesUnit: scope3Categories[2].unit,
                upstreamTransportationAndDistributionTotal: scope3Categories[3].total,
                upstreamTransportationAndDistributionUnit: scope3Categories[3].unit,
                wasteGeneratedInOperationsTotal: scope3Categories[4].total,
                wasteGeneratedInOperationsUnit: scope3Categories[4].unit,
                businessTravelTotal: scope3Categories[5].total,
                businessTravelUnit: scope3Categories[5].unit,
                employeeCommutingTotal: scope3Categories[6].total,
                employeeCommutingUnit: scope3Categories[6].unit,
                upstreamLeasedAssetsTotal: scope3Categories[7].total,
                upstreamLeasedAssetsUnit: scope3Categories[7].unit,
                downstreamTransportationAndDistributionTotal: scope3Categories[8].total,
                downstreamTransportationAndDistributionUnit: scope3Categories[8].unit,
                processingOfSoldProductsTotal: scope3Categories[9].total,
                processingOfSoldProductsUnit: scope3Categories[9].unit,
                useOfSoldProductsTotal: scope3Categories[10].total,
                useOfSoldProductsUnit: scope3Categories[10].unit,
                endOfLifeTreatmentOfSoldProductsTotal: scope3Categories[11].total,
                endOfLifeTreatmentOfSoldProductsUnit: scope3Categories[11].unit,
                downstreamLeasedAssetsTotal: scope3Categories[12].total,
                downstreamLeasedAssetsUnit: scope3Categories[12].unit,
                franchisesTotal: scope3Categories[13].total,
                franchisesUnit: scope3Categories[13].unit,
                investmentsTotal: scope3Categories[14].total,
                investmentsUnit: scope3Categories[14].unit,
                otherTotal: scope3Categories[15].total,
                otherUnit: scope3Categories[15].unit,
              };
        
              rows.push(row);
          });
        });

        return rows;
    }

    toCSV(data) {
        if (data.length === 0) {
            throw new Error('Data array is empty');
        }
        
        // Collect the headers from the keys of the first object
        const headers = Object.keys(data[0]);
        
        // Create the CSV content as a string
        let csv = headers.join(',') + '\n'; // Add header row
        
        // Process each row of data
        data.forEach((row) => {
            const rowValues = headers.map((header) => {
            const value = row[header]; // Get the value for this header
        
            // Handle `null` or `undefined` values
            if (value === null || value === undefined) {
                return '';
            }
        
            // Escape commas and quotes by wrapping the value in quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`; // Escape quotes by doubling them
            }
        
            return value;
            });
        
            // Join the row values with commas and add to the CSV
            csv += rowValues.join(',') + '\n';
        });
        
        return csv;
    }

    async doesValidExportExist(exportedData: 'company' | 'municipality', exportType: 'csv' | 'json'): Promise<{content: string, name: string} | undefined> {
      
      try {
        // Ensure the folder exists
        if (!fs.existsSync(EXPORT_FOLDER_PATH)) {
          fs.mkdirSync(EXPORT_FOLDER_PATH, { recursive: true });
        }
    
        const files = fs.readdirSync(EXPORT_FOLDER_PATH); // Get all files in the folder
        const matchingFile = files.find(
          (file) =>
            file.startsWith(exportedData) && file.endsWith(`.${exportType}`)
        );

        if (matchingFile) {
          const filePath = path.join(EXPORT_FOLDER_PATH, matchingFile);

          if (fs.existsSync(filePath)) {
            const fileStats = fs.statSync(filePath);
            const currentTime = new Date().getTime();
            const fileModifiedTime = new Date(fileStats.mtime).getTime();
      
            // Check if the file is older than 6 months (approx. 182.5 days)
            const sixMonthsInMilliseconds = 182.5 * 24 * 60 * 60 * 1000;
      
            if (currentTime - fileModifiedTime <= sixMonthsInMilliseconds) {
              return {name: matchingFile, content: fs.readFileSync(path.join(EXPORT_FOLDER_PATH, matchingFile), 'utf8')};
            }
          }
        }
        return undefined;
      } catch (error) {
        console.error('An error occurred:', error);
        throw error;
      }
    }

    async createOrUpdateExportFile(exportedData: 'company' | 'municipality', exportType: 'csv' | 'json', data: string): Promise<{content: string, name: string}> {
      try {
        // Ensure the folder exists
        if (!fs.existsSync(EXPORT_FOLDER_PATH)) {
          fs.mkdirSync(EXPORT_FOLDER_PATH, { recursive: true });
        }
    
        const files = fs.readdirSync(EXPORT_FOLDER_PATH); // Get all files in the folder
        console.log(files);
        files.forEach(
          (file) => {
              if(file.startsWith(exportedData) && file.endsWith(`.${exportType}`)) {
                fs.rmSync(path.join(EXPORT_FOLDER_PATH, file));
              }
            }
        );

        const fileName = exportedData + "-" + this.getFormattedCurrentDate() + "." + exportType;
        const filePath = path.join(EXPORT_FOLDER_PATH, fileName);

        fs.writeFileSync(filePath, data, 'utf8');

        return {name: fileName, content: fs.readFileSync(path.join(EXPORT_FOLDER_PATH, fileName), 'utf8')};
      } catch (error) {
        console.error('An error occurred:', error);
        throw error;
      }
    }

    getFormattedCurrentDate(): string {
      const date = new Date();
      const year = date.getFullYear(); // Get the 4-digit year (e.g., 2025)
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (1-based, padded to 2 digits)
      const day = date.getDate().toString().padStart(2, '0'); // Get the day (padded to 2 digits)
    
      return `${year}-${month}-${day}`; // Concatenate into YYYY-MM-DD format
    }
    
}

export const exportService = new ExportService()