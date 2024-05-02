import csv from 'csv-parser'
import fs from 'fs'
import { CompanyData } from '../models/companyEmissions'

// Scope 1     ,Scope 2 (LB) ,Scope 2 (MB) ,Scope 1+2   ,Scope 3 (total)
function mapFacitToCompanyData(row): CompanyData {
  return {
    companyName: row['Company'],
    emissions: [
      {
        year: 2023,
        scope1: row['23_Scope 1'],
        scope2: {
          lb: row['23_Scope 2 (LB)'],
          mb: row['23_Scope 2 (MB)'],
          emissions: row['23_Scope 1+2'],
        },
        scope3: {
          emissions: row['23_Scope 3 (total)'],
          categories: {
            'Category 1': parseFloat(row['Cat 1']),
            'Category 2': parseFloat(row['Cat 1']),
            'Category 3': parseFloat(row['Cat 3']),
            'Category 4': parseFloat(row['Cat 4']),
            'Category 5': parseFloat(row['Cat 5']),
            'Category 6': parseFloat(row['Cat 6']),
            'Category 7': parseFloat(row['Cat 7']),
            'Category 8': parseFloat(row['Cat 8']),
            'Category 9': parseFloat(row['Cat 9']),
            'Category 10': parseFloat(row['Cat 10']),
            'Category 11': parseFloat(row['Cat 11']),
            'Category 12': parseFloat(row['Cat 12']),
            'Category 13': parseFloat(row['Cat 13']),
            'Category 14': parseFloat(row['Cat 14']),
            'Category 15': parseFloat(row['Cat 15']),
          },
        },
      },
    ],
  }
}

export function findFacit(url: string): Promise<CompanyData> {
  const all = []
  return new Promise((resolve) => {
    fs.createReadStream(fs.realpathSync('../data/facit.csv'))
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) => value.trim(),
        })
      )
      .on('data', (data) => all.push(data))
      .on('end', () => {
        const found = all.find((result) => result['URL 2023'] === url)
        console.log('found', found)
        resolve(mapFacitToCompanyData(found))
      })
  })
}

// findFacit(
//   'https://www.arla.com/493552/globalassets/arla-global/company---overview/investor/annual-reports/2023/arla_annual-report-2023_se_v2.pdf'
// ).then((result) => {
//   console.log(JSON.stringify(result, null, 2))
// })
