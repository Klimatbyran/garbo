import Firecrawl, { SearchResultWeb } from '@mendable/firecrawl-js'
import { CompanyReports, saveReportsBody, saveReportsResult } from '../types'
import { pdf } from 'pdf-to-img'
import ky from 'ky'
import { prisma } from '../../lib/prisma'
import sharp from 'sharp'
import { ReportsListResponseSchema } from '../schemas/response'
import { z } from 'zod'

const API_KEY = process.env.FIRECRAWL_API_KEY

// TODO: Evaluate mapping the firecrawler type to internal type definition.
type ReportsListResponse = z.infer<typeof ReportsListResponseSchema>

class ReportsService {
  async collectReportUrls(
    companies: CompanyReports
  ): Promise<ReportsListResponse> {
    const firecrawl = new Firecrawl({ apiKey: API_KEY })
    const results: ReportsListResponse = []

    for (const company of companies) {
      const year = company.reportYear ? `${company.reportYear}` : ''
      const searchQuery = `"${company.name}" ${year} (sustainability report OR annual report) filetype:pdf Sweden`

      const searchResult = await firecrawl.search(searchQuery, { limit: 5 })

      let companyResults: Array<{
        url?: string
        title?: string
        description?: string
        position?: number
      }> = []
      if (searchResult.web && searchResult.web.length > 0) {
        companyResults = await Promise.all(
          searchResult.web
            .filter((result): result is SearchResultWeb => 'url' in result)
            .map(async (result, idx) => {
              try {
                const endUrl = await ky(result.url)
                if (endUrl.url.endsWith('.pdf')) {
                  return {
                    url: endUrl.url,
                    title: result.title,
                    description: result.description,
                    position: idx,
                  }
                }
              } catch (err) {
                // Fallback to original URL if ky fails
                return {
                  url: result.url,
                  title: result.title,
                  description: result.description,
                  position: idx,
                  error: 'Failed to resolve PDF link',
                }
              }
              return {
                url: result.url,
                title: result.title,
                description: result.description,
                position: idx,
              }
            })
        )
      }

      results.push({
        companyName: company.name,
        results: companyResults,
      })
    }

    return results
  }

  /**
   * Generates a preview image (JPG) from the first page of a PDF URL.
   * Returns a data URL or null if failed.
   */
  async generateReportPreview(pdfUrl: string): Promise<Buffer | null> {
    try {
      const response = await ky(pdfUrl)
      const arrayBuffer = await response.arrayBuffer()
      const pdfBuffer = Buffer.from(arrayBuffer)
      const document = await pdf(pdfBuffer, { scale: 0.5 })
      const pageBuffer = await document.getPage(1)

      const jpegBuffer = await sharp(pageBuffer)
        .jpeg({ quality: 60 })
        .toBuffer()
      return jpegBuffer
    } catch (err) {
      return null
    }
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
            wikidataId: report.wikidataId ?? undefined,
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
        if (error?.code === 'P2002') {
          results.push({
            error: 'duplicate',
            companyName: report.companyName,
            reportYear: report.reportYear,
            message: 'A report for this company and year already exists.',
          })
          continue
        }

        results.push({
          error: 'unknown',
          companyName: report.companyName,
          reportYear: report.reportYear,
          message: 'Failed to save report.',
        })
      }
    }

    return results
  }
}

export const reportsService = new ReportsService()
