import Firecrawl, { Document, SearchResultWeb } from '@mendable/firecrawl-js'
import { CompanyReports, saveReportsBody } from '../types'
import { saveReportsResult } from '../types'
import { prisma } from '../../lib/prisma'
const API_KEY = process.env.FIRECRAWL_API_KEY

// TODO: Evaluate mapping the firecrawler type to internal type definition.
type CompanyReportUrls = {
  companyName: string
  results: Array<SearchResultWeb | Document>
}
// Types for saveReportsToDb results

class ReportsService {
  async collectReportUrls(
    companies: CompanyReports
  ): Promise<CompanyReportUrls[]> {
    const firecrawl = new Firecrawl({ apiKey: API_KEY })
    const results: CompanyReportUrls[] = []

    for (const company of companies) {
      const year = company.reportYear ? `${company.reportYear}` : ''
      const searchQuery = `"${company.name}" ${year} (sustainability report OR annual report) filetype:pdf Sweden`

      const searchResult = await firecrawl.search(searchQuery, { limit: 5 })
      console.log(searchResult)

      results.push({
        companyName: company.name,
        results: searchResult.web ?? [],
      })
    }
    return results
  }

  async getAllCompanies() {
    const companies = await prisma.company.findMany({
      select: {
        name: true,
        wikidataId: true,
        reportingPeriods: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            reportURL: true,
          },
        },
      },
    })
    return companies
  }

  async saveReportsToDb(
    saveReportsBody: saveReportsBody
  ): Promise<saveReportsResult> {
    const results: saveReportsResult = []
    for (const report of saveReportsBody) {
      try {
        const saved = await prisma.report.create({
          data: {
            companyName: report.companyName,
            wikidataId: report.wikidataId || undefined || null,
            reportYear: report.reportYear,
            url: report.url,
          },
        })
        results.push({
          id: saved.id,
          companyName: saved.companyName,
          wikidataId: saved.wikidataId,
          reportYear: saved.reportYear,
          url: saved.url,
        })
      } catch (error: any) {
        if (error.code === 'P2002') {
          results.push({
            error: 'duplicate',
            companyName: report.companyName,
            reportYear: report.reportYear,
            message: 'A report for this company and year already exists.',
          })
        } else {
          results.push({
            error: 'unknown',
            companyName: report.companyName,
            reportYear: report.reportYear,
            message: 'Failed to save report.',
          })
        }
      }
    }
    return results
  }
}
export const reportsService = new ReportsService()
