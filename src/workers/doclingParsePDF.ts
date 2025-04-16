import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'
import { paths, components } from '../lib/docling-api-types'
import docling from '../config/docling'
import redis from '../config/redis'

type ProcessUrlAsyncResponse = paths['/v1alpha/convert/source/async']['post']['responses']['200']['content']['application/json']
type TaskStatusResponse = paths['/v1alpha/status/poll/{task_id}']['get']['responses']['200']['content']['application/json']
type TaskResultResponse = paths['/v1alpha/result/{task_id}']['get']['responses']['200']['content']['application/json']

class DoclingParsePDFJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    url: string
    doclingSettings?: components['schemas']['ConvertDocumentHttpSourcesRequest']
    taskId?: string
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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const doclingParsePDF = new DiscordWorker(
  QUEUE_NAMES.DOCLING_PARSE_PDF,
  async (job: DoclingParsePDFJob) => {
    const { url, doclingSettings, taskId } = job.data
    
    try {
      // If we already have a task ID, check its status
      if (taskId) {
        job.log(`Checking status of existing task: ${taskId}`)
        return await pollTaskAndGetResult(job, taskId)
      }
      
      // Initialize settings if not already set
      if (!doclingSettings) {
        const requestPayload = createRequestPayload(url)
        job.updateData({
          ...job.data,
          doclingSettings: requestPayload
        })
      }
      
      job.sendMessage('Starting PDF parsing with Docling (async mode)...')
      
      // Submit the async task
      const startTime = Date.now()
      job.log('Submitting async task to Docling API...')
      
      try {
        const asyncRequestUrl = `${docling.baseUrl}/v1alpha/convert/source/async`
        job.log(`Making request to: ${asyncRequestUrl}`)
        job.log(`With payload: ${JSON.stringify(job.data.doclingSettings)}`)
        
        const response = await fetch(asyncRequestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(job.data.doclingSettings)
        })
        
        job.log(`Response status: ${response.status} ${response.statusText}`)
        
        if (!response.ok) {
          try {
            const errorBody = await response.text()
            job.log(`Error response body: ${errorBody}`)
            throw new Error(`Docling API responded with status: ${response.status}`)
          } catch (bodyError) {
            job.log(`Failed to read error response body: ${bodyError.message}`)
            throw new Error(`Docling API responded with status: ${response.status}`)
          }
        }
        
        const asyncResponse = await response.json() as ProcessUrlAsyncResponse
        const newTaskId = asyncResponse.task_id
        job.log(`Task submitted successfully with task ID: ${newTaskId}`)
        
        // Update job data to include the task ID for polling
        job.updateData({
          ...job.data,
          taskId: newTaskId
        })
        
        // Now poll for the task status and get results
        return await pollTaskAndGetResult(job, newTaskId)
        
      } catch (networkError) {
        job.log(`Network error details: ${JSON.stringify({
          name: networkError.name,
          message: networkError.message,
          cause: networkError.cause,
          stack: networkError.stack
        }, null, 2)}`)
        
        throw new Error(`Failed to connect to Docling API: ${networkError.message}`)
      }
      
    } catch (error) {
      job.log('Error: ' + error)
      job.editMessage(
        `Failed to parse PDF: ${error.message || 'Unknown error'}`
      )
      throw error
    }
  },
  { concurrency: 1, connection: redis, lockDuration: 30 * 60 * 1000 } // Increased lock duration for async processing
)

async function pollTaskAndGetResult(job: DoclingParsePDFJob, taskId: string): Promise<{ markdown: string }> {
  const startTime = Date.now()
  let isComplete = false
  let status = ''
  
  job.editMessage(`Parsing PDF... (Task ID: ${taskId})`)
  
  // Poll for the task status until it's complete
  while (!isComplete) {
    try {
      const statusUrl = `${docling.baseUrl}/v1alpha/status/poll/${taskId}?wait=5`
      job.log(`Polling task status: ${statusUrl}`)
      
      const statusResponse = await fetch(statusUrl)
      
      if (!statusResponse.ok) {
        throw new Error(`Status check failed with status: ${statusResponse.status}`)
      }
      
      const statusData = await statusResponse.json() as TaskStatusResponse
      status = statusData.task_status
      
      job.log(`Current task status: ${status}, position: ${statusData.task_position || 'N/A'}`)
      
      // Update the message with current status and elapsed time
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
      job.editMessage(`Parsing PDF... Status: ${status} (elapsed: ${elapsedTime}s)`)
      
      if (status === 'success' || status === 'partial_success') {
        isComplete = true
      } else if (status === 'failure' || status === 'skipped') {
        throw new Error(`Task failed with status: ${status}`)
      } else {
        // Wait 5 seconds before polling again (in addition to the wait param in the URL)
        await sleep(5000)
      }
    } catch (error) {
      job.log(`Error checking task status: ${error.message}`)
      await sleep(5000) // Wait before retrying on error
    }
  }
  
  // Task is complete, fetch the result
  job.log(`Task complete, fetching results...`)
  
  const resultUrl = `${docling.baseUrl}/v1alpha/result/${taskId}`
  const resultResponse = await fetch(resultUrl)
  
  if (!resultResponse.ok) {
    throw new Error(`Failed to fetch results: ${resultResponse.status}`)
  }
  
  const resultData = await resultResponse.json() as TaskResultResponse
  const markdown = resultData.document.md_content || ''
  
  if (!markdown) {
    job.log('Warning: No markdown found in results')
    throw new Error('No markdown found in results')
  }
  
  const totalTime = Math.floor((Date.now() - startTime) / 1000)
  job.editMessage(`PDF parsed successfully in ${totalTime}s`)
  job.log(`Task completed in ${totalTime}s`)
  job.log(markdown)
  
  return { markdown }
}

export default doclingParsePDF