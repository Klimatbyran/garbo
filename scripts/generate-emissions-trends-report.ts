// src/scripts/generate-emissions-trends-report.ts
import fs from 'fs'
import ExcelJS from 'exceljs'
import {
  calculateFutureEmissionTrend,
  Company,
} from '../src/lib/companyEmissionsFutureTrendCalculator.js'
import { createCanvas } from 'canvas'
import { jsPDF } from 'jspdf'

// Define the company structure based on the API response
interface ApiCompany {
  name: string
  wikidataId: string
  lei?: string
  reportingPeriods: {
    startDate: string
    endDate: string
    emissions: {
      calculatedTotalEmissions: number | null
      scope1?: { total: number } | null
      scope2?: { mb?: number; lb?: number; unknown?: number } | null
      scope3?: {
        calculatedTotalEmissions?: number
        statedTotalEmissions?: { total: number } | null
        categories?: { category: number; total: number }[]
      } | null
    }
  }[]
  baseYear?: {
    year: number
  }
}

// Map API company to our calculator input format
function mapToCalculatorFormat(apiCompany: ApiCompany) {
  const company: Company = {
    reportedPeriods: apiCompany.reportingPeriods
      .filter((period) => period.emissions !== null)
      .map((period) => ({
        year: new Date(period.startDate).getFullYear(),
        emissions: {
          calculatedTotalEmissions:
            period.emissions?.calculatedTotalEmissions || 0,
          scope1: period.emissions?.scope1 || undefined,
          scope2: period.emissions?.scope2
            ? {
                mb: period.emissions.scope2.mb || 0,
                lb: period.emissions.scope2.lb || 0,
                unknown: period.emissions.scope2.unknown || 0,
              }
            : undefined,
          scope3: period.emissions?.scope3
            ? {
                statedTotalEmissions:
                  period.emissions.scope3.statedTotalEmissions || undefined,
                categories: period.emissions.scope3.categories || [],
              }
            : undefined,
        },
      })),
    baseYear: apiCompany.baseYear?.year,
  }
  return company
}

// Create a graph for a company's emissions data
function createCompanyGraph(company: ApiCompany, trendSlope: number | null) {
  const canvas = createCanvas(800, 400)
  const ctx = canvas.getContext('2d')

  // Sort periods by year
  const periods = [...company.reportingPeriods].sort(
    (a, b) =>
      new Date(a.startDate).getFullYear() - new Date(b.startDate).getFullYear(),
  )

  // Extract years and emissions, ensuring no null values
  const validPeriods = periods.filter(
    (p) => p.emissions && p.emissions.calculatedTotalEmissions !== null,
  )

  // Skip if no valid data
  if (validPeriods.length === 0) {
    return null
  }

  const years = validPeriods.map((p) => new Date(p.startDate).getFullYear())
  const emissions = validPeriods.map(
    (p) => p.emissions.calculatedTotalEmissions || 0,
  )

  // Extract scope 3 emissions
  const scope3Emissions = validPeriods.map((p) => {
    // Use calculated total if available, otherwise use stated total if available
    const s3 = p.emissions.scope3
    return s3?.calculatedTotalEmissions || s3?.statedTotalEmissions?.total || 0
  })

  // Skip if no data or all zeros
  if (years.length === 0 || emissions.every((e) => e === 0)) {
    return null
  }

  // Calculate min/max for scale (only using valid positive values)
  const validEmissions = emissions.filter((e) => e > 0)
  const validScope3 = scope3Emissions.filter((e) => e > 0)
  const maxEmission = Math.max(
    validEmissions.length > 0 ? Math.max(...validEmissions) * 1.1 : 100,
    validScope3.length > 0 ? Math.max(...validScope3) * 1.1 : 100,
  )
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years) + 5 // Add 5 years

  // Setup canvas
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 800, 400)

  // Draw axes
  ctx.strokeStyle = 'black'
  ctx.beginPath()
  ctx.moveTo(50, 350)
  ctx.lineTo(750, 350) // x-axis
  ctx.moveTo(50, 350)
  ctx.lineTo(50, 50) // y-axis
  ctx.stroke()

  // Add year ticks on x-axis
  ctx.fillStyle = 'black'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'

  // Calculate appropriate year interval for ticks
  const yearSpan = maxYear - minYear
  const yearInterval = yearSpan > 10 ? 2 : 1

  for (let year = minYear; year <= maxYear; year += yearInterval) {
    const x = 50 + (year - minYear) * (700 / (maxYear - minYear))

    // Draw tick mark
    ctx.beginPath()
    ctx.moveTo(x, 350)
    ctx.lineTo(x, 355)
    ctx.stroke()

    // Draw year label
    ctx.fillText(year.toString(), x, 370)
  }

  // Reset text alignment for other text elements
  ctx.textAlign = 'left'

  // Draw historical data points - Total emissions
  ctx.fillStyle = 'blue'
  years.forEach((year, i) => {
    const x = 50 + (year - minYear) * (700 / (maxYear - minYear))
    const y = 350 - (emissions[i] / maxEmission) * 300

    if (emissions[i] !== null) {
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  // Draw connecting line between historical data points - Total emissions
  if (years.length > 1) {
    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 2
    ctx.beginPath()

    // Start from the first point
    const firstYear = years[0]
    const firstX = 50 + (firstYear - minYear) * (700 / (maxYear - minYear))
    const firstY = 350 - (emissions[0] / maxEmission) * 300
    ctx.moveTo(firstX, firstY)

    // Connect to each subsequent point
    for (let i = 1; i < years.length; i++) {
      const year = years[i]
      const x = 50 + (year - minYear) * (700 / (maxYear - minYear))
      const y = 350 - (emissions[i] / maxEmission) * 300
      ctx.lineTo(x, y)
    }

    ctx.stroke()
    ctx.lineWidth = 1 // Reset line width for other elements
  }

  // Draw historical data points - Scope 3 emissions
  ctx.fillStyle = 'green'
  years.forEach((year, i) => {
    if (scope3Emissions[i] > 0) {
      const x = 50 + (year - minYear) * (700 / (maxYear - minYear))
      const y = 350 - (scope3Emissions[i] / maxEmission) * 300

      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  // Draw connecting line between historical data points - Scope 3 emissions
  if (scope3Emissions.some((e) => e > 0)) {
    ctx.strokeStyle = 'green'
    ctx.lineWidth = 2
    ctx.beginPath()

    // Find the first valid point
    const firstValidIndex = scope3Emissions.findIndex((e) => e > 0)
    if (firstValidIndex >= 0) {
      const firstYear = years[firstValidIndex]
      const firstX = 50 + (firstYear - minYear) * (700 / (maxYear - minYear))
      const firstY =
        350 - (scope3Emissions[firstValidIndex] / maxEmission) * 300
      ctx.moveTo(firstX, firstY)

      // Connect to each subsequent valid point
      for (let i = firstValidIndex + 1; i < years.length; i++) {
        if (scope3Emissions[i] > 0) {
          const year = years[i]
          const x = 50 + (year - minYear) * (700 / (maxYear - minYear))
          const y = 350 - (scope3Emissions[i] / maxEmission) * 300
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
      ctx.lineWidth = 1 // Reset line width for other elements
    }
  }

  // Draw trend line if available
  if (trendSlope !== null && years.length >= 2) {
    // Use the last historical data point as starting point
    const lastIndex = years.length - 1
    const startYear = years[lastIndex]
    const startEmission = emissions[lastIndex]

    if (startEmission !== null) {
      ctx.strokeStyle = 'red'
      ctx.beginPath()

      const startX = 50 + (startYear - minYear) * (700 / (maxYear - minYear))
      const startY = 350 - (startEmission / maxEmission) * 300

      ctx.moveTo(startX, startY)

      // Project 5 years into the future
      for (let i = 1; i <= 5; i++) {
        const projectedYear = startYear + i
        const projectedEmission = startEmission + trendSlope * i

        const x = 50 + (projectedYear - minYear) * (700 / (maxYear - minYear))
        const y = 350 - (projectedEmission / maxEmission) * 300

        ctx.lineTo(x, y)
      }

      ctx.stroke()

      // Add slope label
      ctx.fillStyle = 'black'
      ctx.font = '12px Arial'
      ctx.fillText(`Trend slope: ${trendSlope.toFixed(2)} tCO2e/year`, 550, 30)
    }
  }

  // Add base year marker if available
  if (company.baseYear?.year) {
    const baseYear = company.baseYear.year
    if (baseYear >= minYear && baseYear <= maxYear) {
      // Draw vertical dashed line at base year
      ctx.strokeStyle = 'green'
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      const baseYearX = 50 + (baseYear - minYear) * (700 / (maxYear - minYear))
      ctx.moveTo(baseYearX, 350)
      ctx.lineTo(baseYearX, 50)
      ctx.stroke()
      ctx.setLineDash([])

      // Add label for base year
      ctx.fillStyle = 'green'
      ctx.font = '12px Arial'
      ctx.fillText('Base Year', baseYearX - 25, 40)
    }
  }

  // Add legend
  ctx.fillStyle = 'black'
  ctx.font = '12px Arial'
  ctx.fillRect(600, 50, 15, 15)
  ctx.fillStyle = 'blue'
  ctx.fillRect(600, 50, 15, 15)
  ctx.fillStyle = 'black'
  ctx.fillText('Total Emissions', 620, 60)

  ctx.fillStyle = 'green'
  ctx.fillRect(600, 70, 15, 15)
  ctx.fillStyle = 'black'
  ctx.fillText('Scope 3 Emissions', 620, 80)

  // Add labels
  ctx.fillStyle = 'black'
  ctx.font = '14px Arial'
  ctx.fillText(company.name, 300, 20)
  ctx.fillText('Year', 400, 380)

  // Rotate for y-axis label
  ctx.save()
  ctx.translate(15, 200)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('Emissions (tCO2e)', 0, 0)
  ctx.restore()

  return canvas
}

// Main function
async function generateEmissionsTrendReport() {
  try {
    console.log('Reading companies data from local file...')
    // Read from local JSON file instead of API
    const companiesPath =
      '/Users/elviraboman/Documents/Garbo/garbo/src/data/companies.json'
    const allCompanies = JSON.parse(fs.readFileSync(companiesPath, 'utf8'))

    // List of wikidataIds to process
    const wikidataIdsToProcess = [
      'Q4356297',
      'Q1028092',
      'Q187854',
      'Q6460556',
      'Q106647141',
      'Q105965579',
      'Q115168501',
      'Q130366912',
      'Q115167139',
      'Q3437039',
      'Q126366671',
      'Q7295902',
      'Q5464603',
      'Q115167405',
      'Q49103488',
      'Q6696047',
      'Q1571428',
      'Q10684798',
      'Q11977084',
      'Q10397786',
      'Q17102820',
      'Q1657823',
      'Q28449044',
      'Q130367296',
      'Q134691493',
      'Q126366693',
      'Q10429580',
      'Q1423707',
      'Q63993633',
      'Q10535401',
      'Q2084093',
      'Q1703203',
      'Q43895238',
      'Q10434929',
      'Q792486',
      'Q5055199',
      'Q106594396',
      'Q4994121',
      'Q627577',
      'Q975655',
      'Q1324884',
      'Q10443838',
      'Q10423854',
      'Q54075',
      'Q891345',
    ]

    // Filter companies to only include those in the list
    const companies = allCompanies.filter((company) =>
      wikidataIdsToProcess.includes(company.wikidataId),
    )

    console.log(
      `Processing ${companies.length} companies out of ${allCompanies.length} total`,
    )

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    // Also create Excel for raw data
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Emissions Trends')

    // Add headers to Excel
    sheet.columns = [
      { header: 'Company', key: 'company', width: 30 },
      { header: 'Trend Slope', key: 'slope', width: 15 },
      { header: 'Base Year', key: 'baseYear', width: 10 },
    ]

    // Process each company
    let currentPage = 1
    for (const company of companies) {
      console.log(`Processing ${company.name}...`)

      // Convert to calculator format
      const calculatorInput = mapToCalculatorFormat(company)
      // Calculate trend
      const futureEmissionTrendSlope =
        calculateFutureEmissionTrend(calculatorInput)

      // Add to Excel
      sheet.addRow({
        company: company.name,
        wikidataId: company.wikidataId,
        slope: futureEmissionTrendSlope,
        baseYear: company.baseYear?.year || 'N/A',
      })

      // Create graph
      const canvas = createCompanyGraph(company, futureEmissionTrendSlope)

      if (canvas) {
        // Add a new page if not the first graph
        if (currentPage > 1) {
          pdf.addPage()
        }

        // Add the graph to PDF
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', 10, 10, 280, 140)

        // Add metadata below graph
        pdf.setFontSize(10)
        pdf.text(`Company: ${company.name}`, 10, 160)
        pdf.text(`Wikidata ID: ${company.wikidataId}`, 10, 170)
        pdf.text(
          `Base year: ${company.baseYear?.year || 'Not defined'}`,
          10,
          180,
        )
        pdf.text(
          `Base year by: ${company.baseYear?.metadata.user.name || 'Not defined'}`,
          10,
          190,
        )
        pdf.text(
          `Trend slope: ${futureEmissionTrendSlope ? futureEmissionTrendSlope.toFixed(2) + ' tCO2e/year' : 'Insufficient data'}`,
          10,
          200,
        )

        currentPage++
      }
    }

    // Save files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    pdf.save(`emissions-trends-report-${timestamp}.pdf`)
    await workbook.xlsx.writeFile(`emissions-trends-data-${timestamp}.xlsx`)

    console.log('Report generation completed successfully')
    console.log(`PDF saved as: emissions-trends-report-${timestamp}.pdf`)
    console.log(`Excel data saved as: emissions-trends-data-${timestamp}.xlsx`)
  } catch (error) {
    console.error('Error generating report:', error)
  }
}

// Run the script
generateEmissionsTrendReport()
