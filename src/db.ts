import config from './config/redis'
import { createClient } from 'redis'
import * as crypto from 'crypto'

class Db {
  client: any

  constructor(config: any) {
    try {
      this.client = createClient(config)
    } catch (error) {
      console.error('Redis constructor error:', error)
    }
  }

  public hashPdf(pdfBuffer: Buffer): string {
    return crypto.createHash('sha256').update(pdfBuffer).digest('hex')
  }

  async indexReport(pdfHash: string, reportData: string, url: string) {
    try {
      const response = await this.client.set(
        pdfHash,
        JSON.stringify({
          url: url,
          pdfHash: pdfHash,
          report: reportData,
          state: 'pending',
          timestamp: new Date(),
        })
      )
      console.log(`Report data added. Document ID: ${pdfHash}`)
      return pdfHash
    } catch (error) {
      console.error(`Error adding report data:`, error)
    }
  }

  async updateDocumentState(documentId: string, newState: string) {
    try {
      const existing = await this.client.get(documentId)
      if (!existing) {
        console.error(`Document ID ${documentId} not found.`)
        return
      }
      existing.state = newState
      await this.client.set(documentId, JSON.stringify(existing))
      console.log(`Document ${documentId} state updated to ${newState}.`)
    } catch (error) {
      console.error(
        `Error updating document state for Document ID ${documentId}:`,
        error
      )
    }
  }
}

export default new Db(config)
