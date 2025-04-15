import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'
import { paths, components } from '../lib/docling-api-types'
import docling from '../config/docling'
import redis from '../config/redis'

type ProcessUrlResponse = paths['/v1alpha/convert/source']['post']['responses']['200']['content']['application/json']

class DoclingParsePDFJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    url: string
    doclingSettings?: components['schemas']['ConvertDocumentHttpSourcesRequest']
  }
}

function createRequestPayload(url: string): components['schemas']['ConvertDocumentHttpSourcesRequest'] {
  const requestPayload: components['schemas']['ConvertDocumentHttpSourcesRequest'] = {
    options: {
      from_formats: ['pdf'],
      to_formats: ['md'],
      image_export_mode: 'placeholder',
      do_ocr: true,
      force_ocr: false,
      ocr_engine: 'easyocr',
      pdf_backend: 'dlparse_v4',
      table_mode: 'fast',
      abort_on_error: false,
      return_as_file: false,
      do_table_structure: true,
      include_images: false,
      images_scale: 2,
      do_code_enrichment: false,
      do_formula_enrichment: false,
      do_picture_classification: false,
      do_picture_description: false
    },
    http_sources: [
      {
        url,
        headers: {}
      }
    ]
  }
  
  return requestPayload
}

const doclingParsePDF = new DiscordWorker(
  QUEUE_NAMES.DOCLING_PARSE_PDF,
  async (job: DoclingParsePDFJob) => {
    const { url, doclingSettings } = job.data

    try {
      
      if (!doclingSettings) {
        
        // Create request payload for Docling API
        const requestPayload = createRequestPayload(url)
        
        // Store docling settings to job data, so we can use them later
        job.updateData({
          ...job.data,
          doclingSettings: requestPayload
        })
      }
      
      job.sendMessage('Parsing PDF with Docling...')
      
      // Make the request to Docling API using fetch
      job.log('Starting Docling API request...')
      const startTime = Date.now()
      
      let response: Response

      try {
        const requestUrl = `${docling.baseUrl}/v1alpha/convert/source`
        job.log(`Making request to: ${requestUrl}`)
        job.log(`With payload: ${JSON.stringify(job.data.doclingSettings)}`)

        response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(job.data.doclingSettings)
        })

        // Log response status and headers for debugging
        job.log(`Response status: ${response.status} ${response.statusText}`)

        const responseHeaders = Object.fromEntries(response.headers.entries())
        job.log(`Response headers: ${JSON.stringify(responseHeaders)}`)

        if (!response.ok) {
          // Try to get error details from response body
          try {
            const errorBody = await response.text()
            job.log(`Error response body: ${errorBody}`)
            // We'll clone the response since we've consumed it
            response = new Response(errorBody, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            })
          } catch (bodyError) {
            job.log(`Failed to read error response body: ${bodyError.message}`)
          }
        }
      } catch (networkError) {
        job.log(`Network error details: ${JSON.stringify({
          name: networkError.name,
          message: networkError.message,
          cause: networkError.cause,
          stack: networkError.stack
        }, null, 2)}`)

        throw new Error(`Failed to connect to Docling API: ${networkError.message}`)
      }

      const elapsedTime = Date.now() - startTime
      job.log(`Docling API request completed in ${elapsedTime}ms`)
      job.editMessage(`PDF parsed in ${elapsedTime}ms`)

      if (!response.ok) {
        throw new Error(`Docling API responded with status: ${response.status}`)
      }

      const data = await response.json() as ProcessUrlResponse
      const markdown = data.document.md_content || ''
      
      // if no markdown is found, log a warning and throw an error
      if (!markdown) {
        job.log('Warning: No markdown found')
        throw new Error('No markdown found')
      }
      
      job.log(markdown)

      return { markdown }
      
    } catch (error) {
      job.log('Error: ' + error)
      job.editMessage(
        `Failed to parse PDF: ${error.message || 'Unknown error'}`
      )
      throw error
    }
  },
  { concurrency: 1, connection: redis, lockDuration: 10 * 60 * 1000 }
)

export default doclingParsePDF
