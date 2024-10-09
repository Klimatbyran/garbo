import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'
import { CompanyData } from '../models/companyEmissions'

const facitPath = path.join(process.cwd(), 'src/data/facit.csv')

const parse = (str) =>
  parseFloat(str.replaceAll(',', '').replace(/[^0-9.]/g, ''))

// csv headers:
// companyName,url,23_scope1,23_scope2MB,23_scope2LB,23_scope3,23_total,23_scope1_2Sum,23_scope3Sum,23_totalSum,23_scope3_1,23_scope3_2,23_scope3_3,23_scope3_4,23_scope3_5,23_scope3_6,23_scope3_7,23_scope3_8,23_scope3_9,23_scope3_10,23_scope3_11,23_scope3_12,23_scope3_13,23_scope3_14,23_scope3_15,23_scope3_16,23_biogenic
function mapFacitToCompanyData(row): CompanyData {
  return {
    companyName: row['companyName'],
    url: row['url'],
    emissions: {
      '2023': {
        year: '2023',
        scope1: {
          emissions: parse(row['23_scope1']),
        },
        scope2: {
          lb: parse(row['23_scope2LB']),
          mb: parse(row['23_scope2MB']),
          emissions: parse(row['23_scope2MB'] || row['23_scope2LB']),
        },
        scope3: {
          emissions: parse(row['23_scope3']),
          categories: {
            '1_purchasedGoods': parse(row['23_scope3_1']),
            '2_capitalGoods': parse(row['23_scope3_2']),
            '3_fuelAndEnergyRelatedActivities': parse(row['23_scope3_3']),
            '4_upstreamTransportationAndDistribution': parse(
              row['23_scope3_4']
            ),
            '5_wasteGeneratedInOperations': parse(row['23_scope3_5']),
            '6_businessTravel': parse(row['23_scope3_6']),
            '7_employeeCommuting': parse(row['23_scope3_7']),
            '8_upstreamLeasedAssets': parse(row['23_scope3_8']),
            '9_downstreamTransportationAndDistribution': parse(
              row['23_scope3_9']
            ),
            '10_processingOfSoldProducts': parse(row['23_scope3_10']),
            '11_useOfSoldProducts': parse(row['23_scope3_11']),
            '12_endOfLifeTreatmentOfSoldProducts': parse(row['23_scope3_12']),
            '13_downstreamLeasedAssets': parse(row['23_scope3_13']),
            '14_franchises': parse(row['23_scope3_14']),
            '15_investments': parse(row['23_scope3_15']),
            '16_other': parse(row['23_scope3_16']),
          },
        },
        totalBiogenic: parse(row['23_biogenic']),
      },
    },
  }
}

export function findFacit(
  url: string,
  companyName: string
): Promise<CompanyData> {
  if (!url && !companyName)
    return Promise.reject(new Error('No url or name provided'))
  const all = []
  return new Promise((resolve, reject) => {
    try {
      fs.createReadStream(facitPath)
        .pipe(
          csv({
            mapHeaders: ({ header }) => header.trim(),
            mapValues: ({ value }) => value.trim(),
          })
        )
        .on('data', (data) => all.push(data))
        .on('end', () => {
          const found = all.find(
            (result) =>
              result['url'] === url ||
              result['companyName']
                .toLowerCase()
                .startsWith(companyName.toLowerCase()) ||
              companyName
                .toLowerCase()
                .startsWith(result['companyName'].toLowerCase()) // also find Ericsson AB when searching for Ericsson
          )
          if (!found) {
            return reject(new Error('No company found'))
          }
          const facit = mapFacitToCompanyData(found)
          resolve(facit)
        })
    } catch (error) {
      console.log('facit error', error)
      reject(error)
    }
  })
}

export function compareFacitToCompanyData(
  facit: CompanyData,
  companyData: CompanyData
) {
  if (!facit || !facit.emissions || !companyData || !companyData.emissions)
    return { summary: 'No data', scope1: null, scope2: null, scope3: null }

  const year = Object.keys(facit.emissions)[0]
  const check = {
    scope1:
      Math.round(facit.emissions[year].scope1?.emissions || 0) ===
      Math.round(companyData.emissions[year]?.scope1?.emissions || 0),
    scope2:
      Math.round(facit.emissions[year].scope2?.emissions || 0) ===
      Math.round(companyData.emissions[year]?.scope2?.emissions || 0),
    scope3:
      Math.round(facit.emissions[year].scope3?.emissions || 0 || 0) ===
      Math.round(companyData.emissions[year]?.scope3?.emissions),
    categories: Object.entries(
      facit.emissions[year].scope3?.categories || []
    ).map(([category, value]) => {
      return {
        category,
        value,
        companyValue:
          (companyData.emissions[year]?.scope3?.categories &&
            companyData.emissions[year].scope3.categories[category]) ||
          0,
        match:
          Math.round(value || 0) ===
          Math.round(
            (companyData.emissions[year]?.scope3?.categories &&
              companyData.emissions[year].scope3.categories[category]) ||
              0
          ),
      }
    }),
    summary: '',
  }
  check.summary = [
    !check.scope1
      ? `Scope 1 ska vara ${facit.emissions[year].scope1?.emissions}`
      : '',
    !check.scope2
      ? `Scope 2 ska vara ${facit.emissions[year].scope2?.emissions}`
      : '',
    !check.scope3
      ? `Scope 3 ska vara ${facit.emissions[year].scope3?.emissions}`
      : '',
  ]
    .filter((n) => n)
    .join('\n')
  return check
}

export function getAllCompanies(): Promise<CompanyData[]> {
  return new Promise((resolve, reject) => {
    try {
      const all = []
      fs.createReadStream(facitPath)
        .pipe(
          csv({
            mapHeaders: ({ header }) => header.trim(),
            mapValues: ({ value }) => value.trim(),
          })
        )
        .on('data', (data) => all.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => {
          console.log('all', all)
          resolve(all.map(mapFacitToCompanyData))
        })
    } catch (error) {
      console.log('facit error', error)
      reject(error)
    }
  })
}
/*
getAllCompanies().then((result) => {
  console.log('facit:', JSON.stringify(result, null, 2))
})*/

// findFacit(
//   'https://www.astrazeneca.se/content/dam/az-se/dokument/hallbarhet/Sustainability-Report-2023.pdftps://www.arla.com/493552/globalassets/arla-global/company---overview/investor/annual-reports/2023/arla_annual-report-2023_se_v2.pdf',
//   'AstraZeneca'
// ).then((result) => {
//   console.log(JSON.stringify(result, null, 2))
// })
