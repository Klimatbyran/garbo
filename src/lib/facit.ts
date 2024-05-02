import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'
import { CompanyData } from '../models/companyEmissions'

const parse = (str) =>
  parseFloat(str.replaceAll(',', '').replace(/[^0-9.]/g, ''))

// Scope 1     ,Scope 2 (LB) ,Scope 2 (MB) ,Scope 1+2   ,Scope 3 (total)
function mapFacitToCompanyData(row): CompanyData {
  return {
    companyName: row['Company'],
    emissions: [
      {
        year: 2023,
        scope1: {
          emissions: parse(row['23_Scope 1']),
        },
        scope2: {
          lb: parse(row['23_Scope 2 (LB)']),
          mb: parse(row['23_Scope 2 (MB)']),
          emissions: parse(row['23_Scope 1+2']),
        },
        scope3: {
          emissions: parse(row['23_Scope 3 (total)']),
          categories: {
            'Category 1': parse(row['Cat 1']),
            'Category 2': parse(row['Cat 1']),
            'Category 3': parse(row['Cat 3']),
            'Category 4': parse(row['Cat 4']),
            'Category 5': parse(row['Cat 5']),
            'Category 6': parse(row['Cat 6']),
            'Category 7': parse(row['Cat 7']),
            'Category 8': parse(row['Cat 8']),
            'Category 9': parse(row['Cat 9']),
            'Category 10': parse(row['Cat 10']),
            'Category 11': parse(row['Cat 11']),
            'Category 12': parse(row['Cat 12']),
            'Category 13': parse(row['Cat 13']),
            'Category 14': parse(row['Cat 14']),
            'Category 15': parse(row['Cat 15']),
          },
        },
      },
    ],
  }
}

export function findFacit(url: string): Promise<CompanyData> {
  const all = []
  return new Promise((resolve, reject) => {
    try {
      fs.createReadStream(path.join(process.cwd(), 'src/data/facit.csv'))
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
    } catch (error) {
      console.log('facit error', error)
      reject(error)
    }
  })
}

// findFacit(
//   'https://www.arla.com/493552/globalassets/arla-global/company---overview/investor/annual-reports/2023/arla_annual-report-2023_se_v2.pdf'
// ).then((result) => {
//   console.log(JSON.stringify(result, null, 2))
// })
