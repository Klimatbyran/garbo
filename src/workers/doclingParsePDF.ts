import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'
import { paths } from '../lib/docling-api-types'
import docling from '../config/docling'
import redis from '../config/redis'

type ProcessUrlAsyncResponse = paths['/v1alpha/convert/source/async']['post']['responses']['200']['content']['application/json']
type TaskStatusResponse = paths['/v1alpha/status/poll/{task_id}']['get']['responses']['200']['content']['application/json']
type TaskResultResponse = paths['/v1alpha/result/{task_id}']['get']['responses']['200']['content']['application/json']

interface BergetDoclingRequest {
  model: "docling-v1",
  document: {
    url: string,
    type: "document"
  },
  async: boolean,
  options: {
    tableMode: "accurate" | "strict",
    ocrMethod: "tesseract" | "easyocr" | "ocrmac" | "rapidocr" | "tesserocr",
    doOcr: boolean,
    doTableStructure: boolean,
    inputFormat: ("pdf" | "html" | "docx" | "pptx")[],
    outputFormat: "md" | "json",
    includeImages: boolean
  }
}

class DoclingParsePDFJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    url: string
    doclingSettings?: BergetDoclingRequest
    taskId?: string
  }
}



function createRequestPayload(url: string): BergetDoclingRequest {
  const requestPayload: BergetDoclingRequest = {
    model: "docling-v1",
    options: {
      inputFormat: ["pdf"],
      outputFormat: "md",
      includeImages: false,
      doOcr: true,
      ocrMethod: "easyocr",
      tableMode: "accurate",
      doTableStructure: true
    },
    async: true,
    document: {
        url,
        type: "document"
    }
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
      job.log('Submitting async task to Docling API...')
      
      try {
        job.log(`Making request to: ${docling.baseUrl}`)
        job.log(`With payload: ${JSON.stringify(job.data.doclingSettings)}`)        
        
        const startRequest = fetch(docling.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${docling.bergetAIToken}`
          },
          body: JSON.stringify(job.data.doclingSettings)
        })

        const startResponse = await startRequest;
        
        job.log(`Response status: ${startResponse.status} ${startResponse.statusText}`)
        
        if (!startResponse.ok) {
          try {
            const errorBody = await startResponse.text()
            job.log(`Error response body: ${errorBody}`)
            throw new Error(`Docling API responded with status: ${startResponse.status}`)
          } catch (bodyError) {
            job.log(`Failed to read error response body: ${bodyError.message}`)
            throw new Error(`Docling API responded with status: ${startResponse.status}`)
          }
        }
        const { resultUrl } = await startResponse.json();

        job.updateData({
          ...job.data,
          jobUrl: resultUrl
        })
        
        return await pollTaskAndGetResult(job, resultUrl);
        
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

async function pollTaskAndGetResult(job: DoclingParsePDFJob, resultUrl: string): Promise<{ markdown: string }> {
  const startTime = Date.now()
  let markdown: string | undefined = undefined;
  
  job.editMessage(`Parsing PDF... (Result Url: ${resultUrl})`)
  
  // Poll for the task status until it's complete
  while (markdown === undefined) {
    job.log(`Polling task status: ${resultUrl}`)
    
    const statusResponse = await fetch(resultUrl, {
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${docling.bergetAIToken}`
      },
    })

    job.log(`Polling status ${statusResponse.status}`)
    
    if (statusResponse.status === 200) {
      const result = await statusResponse.json();
      markdown = result.content; 
    } else if(statusResponse.status === 202) {
      const retryAfter = parseInt(statusResponse.headers.get('Retry-After') || "2");
      await sleep(retryAfter * 1000);
    } else {
      throw new Error(`Status check failed with status: ${statusResponse.status}`)
    }
  }
    
  const totalTime = Math.floor((Date.now() - startTime) / 1000)
  job.editMessage(`PDF parsed successfully in ${totalTime}s`)
  job.log(`Task completed in ${totalTime}s`)
  
  return { markdown }
}

export default doclingParsePDF