import 'dotenv/config'
import ExcelJS from 'exceljs'
import { resolve } from 'path'
import { writeFile } from 'fs/promises'

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(
  resolve('src/data/Klimatkollen_ Company GHG data.xlsx')
)

function getCompanyBaseYears() {
  const sheet = workbook.getWorksheet('Overview')!
  const headers = Object.values(sheet.getRow(2).values!)

  return sheet
    .getSheetValues()
    .slice(3)
    .reduce<{ wikidataId: string; baseYear: number | null }[]>((acc, row) => {
      if (!row) return acc
      const columns = headers.reduce((obj, header, index) => {
        obj[header!.toString()] = row[index + 1]?.result || row[index + 1]
        return obj
      }, {} as Record<string, any>)

      const wikidataId = columns['Wiki ID']
      const baseYears = columns['Base year']
        ?.toString()
        ?.split(/[,/]/)
        .map(Number)
        .filter(Number.isFinite)

      if (wikidataId) {
        acc.push({
          wikidataId,
          baseYear: baseYears?.length ? baseYears[baseYears.length - 1] : null,
        })
      }

      return acc
    }, [])
}

async function main() {
  const companies = getCompanyBaseYears()
  const outputPath = resolve('output', 'base-years.json')

  // Write the extracted data to a JSON file
  await writeFile(outputPath, JSON.stringify(companies, null, 2), 'utf8')

  console.log(`✅ Base years written to ${outputPath}.`)
}

main().catch((err) => {
  console.error('Error during processing:', err)
  process.exit(1)
})
