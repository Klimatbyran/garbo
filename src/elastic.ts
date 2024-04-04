import config from './config/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import * as crypto from 'crypto'

class Elastic {
  client: Client
  indexName: string
  pdfIndex: string

  constructor({ node, indexName }) {
    try {
      this.client = new Client({ node })
      this.indexName = indexName
      this.pdfIndex = 'pdfs'
    } catch (error) {
      console.error('Node URL:', node)
      console.error('Index name:', indexName)
      console.error('Elasticsearch constructor error:', error)
    }
  }

  async setupIndices() {
    await this.createEmissionsIndex()
    await this.createPdfIndex()
  }

  private async createPdfIndex() {
    try {
      console.log(`Checking if index ${this.pdfIndex} exists...`)
      const indexExists = await this.client.indices.exists({
        index: this.pdfIndex,
      })
      if (!indexExists) {
        await this.client.indices.create({
          index: this.pdfIndex,
          body: {
            mappings: {
              properties: {
                pdf: { type: 'binary' },
              },
            },
          },
        })
        console.log(`Index ${this.pdfIndex} created.`)
      } else {
        console.log(`Index ${this.pdfIndex} already exists.`)
      }
    } catch (error) {
      console.error('Elasticsearch pdfIndex error:', error)
    }
  }

  private async createEmissionsIndex() {
    try {
      console.log(`Checking if index ${this.indexName} exists...`)
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      })
      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                pdfHash: { type: 'keyword' },
                report: {
                  type: 'object',
                  properties: {
                    companyName: { type: 'keyword' },
                    url: { type: 'keyword' },
                    industry: { type: 'keyword' },
                    baseYear: { type: 'keyword' },
                    emissions: {
                      type: 'object',
                      properties: {
                        '*': {
                          type: 'object',
                          properties: {
                            year: { type: 'keyword' },
                            scope1: {
                              properties: {
                                emissions: { type: 'double' },
                                unit: { type: 'keyword' },
                              },
                            },
                            scope2: {
                              properties: {
                                emissions: { type: 'double' },
                                unit: { type: 'keyword' },
                                mb: { type: 'double' },
                                lb: { type: 'double' },
                              },
                            },
                            scope3: {
                              properties: {
                                emissions: { type: 'double' },
                                unit: { type: 'keyword' },
                                baseYear: { type: 'keyword' },
                                categories: {
                                  properties: {
                                    '1_purchasedGoods': { type: 'double' },
                                    '2_capitalGoods': { type: 'double' },
                                    '3_fuelAndEnergyRelatedActivities': {
                                      type: 'double',
                                    },
                                    '4_upstreamTransportationAndDistribution': {
                                      type: 'double',
                                    },
                                    '5_wasteGeneratedInOperations': {
                                      type: 'double',
                                    },
                                    '6_businessTravel': { type: 'double' },
                                    '7_employeeCommuting': { type: 'double' },
                                    '8_upstreamLeasedAssets': {
                                      type: 'double',
                                    },
                                    '9_downstreamTransportationAndDistribution':
                                      {
                                        type: 'double',
                                      },
                                    '10_processingOfSoldProducts': {
                                      type: 'double',
                                    },
                                    '11_useOfSoldProducts': { type: 'double' },
                                    '12_endOfLifeTreatmentOfSoldProducts': {
                                      type: 'double',
                                    },
                                    '13_downstreamLeasedAssets': {
                                      type: 'double',
                                    },
                                    '14_franchises': { type: 'double' },
                                    '15_investments': { type: 'double' },
                                    '16_other': { type: 'double' },
                                  },
                                },
                              },
                            },
                            totalEmissions: { type: 'double' },
                            totalUnit: { type: 'keyword' },
                          },
                        },
                      },
                    },
                    reliability: { type: 'keyword' },
                    needsReview: { type: 'boolean' },
                    reviewComment: { type: 'text' },
                    reviewStatusCode: { type: 'keyword' },
                  },
                },
                state: { type: 'keyword' },
                timestamp: { type: 'date' },
              },
            },
          },
        })
        console.log(`Index ${this.indexName} created.`)
      } else {
        console.log(`Index ${this.indexName} already exists.`)
      }
    } catch (error) {
      console.error('Elasticsearch setupIndex error:', error)
    }
  }

  public isValidEmissionReport(report): boolean {
    const isString = (value) => typeof value === 'string'
    const isBoolean = (value) => typeof value === 'boolean'
    const isDouble = (value) => typeof value === 'number'

    const hasValidTopLevelProps =
      isString(report.companyName) &&
      isString(report.industry) &&
      isString(report.baseYear) &&
      isString(report.url) &&
      isString(report.reliability) &&
      isBoolean(report.needsReview) &&
      isString(report.reviewComment) &&
      isString(report.reviewStatusCode)
    if (!hasValidTopLevelProps) return false

    // Validate emissions object structure
    if (typeof report.emissions !== 'object' || report.emissions === null)
      return false

    for (const year of Object.keys(report.emissions)) {
      const yearData = report.emissions[year]
      if (typeof yearData !== 'object' || yearData === null) return false
      if (
        !isString(yearData.year) ||
        !isDouble(yearData.scope1.emissions) ||
        !isDouble(yearData.totalEmissions) ||
        !isDouble(yearData.totalUnit) ||
        !isString(yearData.scope1.unit) ||
        !isDouble(yearData.scope2.emissions) ||
        !isString(yearData.scope2.unit) ||
        !isDouble(yearData.scope2.mb) ||
        !isDouble(yearData.scope2.lb) ||
        !isDouble(yearData.scope3.emissions) ||
        !isString(yearData.scope3.unit) ||
        !isString(yearData.scope3.baseYear)
      )
        return false

      // Validate categories within scope3
      const categories = yearData.scope3.categories
      if (typeof categories !== 'object' || categories === null) return false

      const validCategories = [
        '1_purchasedGoods',
        '2_capitalGoods',
        '3_fuelAndEnergyRelatedActivities',
        '4_upstreamTransportationAndDistribution',
        '5_wasteGeneratedInOperations',
        '6_businessTravel',
        '7_employeeCommuting',
        '8_upstreamLeasedAssets',
        '9_downstreamTransportationAndDistribution',
        '10_processingOfSoldProducts',
        '11_useOfSoldProducts',
        '12_endOfLifeTreatmentOfSoldProducts',
        '13_downstreamLeasedAssets',
        '14_franchises',
        '15_investments',
        '16_other',
      ]

      for (const category of validCategories) {
        if (!isDouble(categories[category])) return false
      }
    }
    return true
  }

  public hashPdf(pdfBuffer: Buffer): string {
    return crypto.createHash('sha256').update(pdfBuffer).digest('hex')
  }

  // Index the PDF using the hash as document ID and returning it for reference
  async indexPdf(pdfBuffer: ArrayBuffer) {
    const buffer = Buffer.from(pdfBuffer)
    const pdfHash = this.hashPdf(buffer)

    try {
      const encodedPdf = buffer.toString('base64')
      await this.client.index({
        index: this.pdfIndex,
        id: pdfHash,
        body: {
          pdf: encodedPdf,
        },
      })
      console.log(`PDF indexed. Document ID: ${pdfHash}`)
      return pdfHash
    } catch (error) {
      console.error(`Error indexing PDF for Document ID ${pdfHash}:`, error)
      // return anyway, as the report is still added later
      return pdfHash
    }
  }

  async indexReport(pdfHash: string, reportData: any) {
    try {
      let parsed
      if (typeof reportData === 'string') {
        console.log('Parsing report data')
        parsed = JSON.parse(reportData)
      } else if (typeof reportData === 'object') {
        console.log('Report data is already parsed')
        parsed = reportData
      } else {
        throw new Error('reportData is neither a string nor an object')
      }

      // Convert from array to object for easier access in elastic
      const emissions = parsed.emissions.reduce((acc, curr) => {
        acc[curr.year] = curr
        return acc
      }, {})

      const report = {
        ...parsed,
        emissions,
      }

      const response = await this.client.index({
        index: this.indexName,
        body: {
          pdfHash: pdfHash,
          report,
          state: 'pending',
          timestamp: new Date(),
        },
      })
      const documentId = response._id
      console.log(`Report data added. Document ID: ${documentId}`)
      return documentId
    } catch (error) {
      console.error(`Error adding report data:`, error)
    }
  }

  async updateDocumentState(documentId: string, newState: string) {
    try {
      await this.client.update({
        index: this.indexName,
        id: documentId,
        body: {
          doc: {
            state: newState,
          },
        },
      })
      console.log(`Document ${documentId} state updated to ${newState}.`)
    } catch (error) {
      console.error(
        `Error updating document state for Document ID ${documentId}:`,
        error
      )
    }
  }

  // TODO support report per year and company (not only latest approved). So; get the latest approved report for each company and year
  async getAllLatestApprovedReports() {
    try {
      const { body } = (await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  terms: {
                    state: ['approved', 'pending'],
                  },
                },
              ],
            },
          },
          sort: [
            {
              'report.companyName': {
                order: 'asc',
              },
              timestamp: {
                order: 'desc',
              },
            },
          ],
          size: 0,
          aggs: {
            latest_reports: {
              terms: {
                field: 'report.companyName.keyword',
                size: 1000,
                order: {
                  latest_timestamp: 'desc',
                },
              },
              aggs: {
                latest_timestamp: {
                  max: {
                    field: 'timestamp',
                  },
                },
                latest_report: {
                  top_hits: {
                    size: 1,
                    sort: [
                      {
                        timestamp: {
                          order: 'desc',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      })) as any

      const reports =
        body.aggregations?.latest_reports?.buckets?.map(
          (bucket) => bucket.latest_report.hits.hits[0]._source
        ) || []
      return reports
    } catch (error) {
      console.error('Error fetching latest approved reports:', error)
      return null
    }
  }
}

export default new Elastic(config)
