import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'
import docling from '../config/docling'
import redis from '../config/redis'

// Berget AI payload structure
interface BergetDoclingRequest {
  model: 'docling-v1'
  document: {
    url: string
    type: 'document'
  }
  async: boolean
  options: {
    tableMode: 'accurate' | 'strict'
    ocrMethod: 'tesseract' | 'easyocr' | 'ocrmac' | 'rapidocr' | 'tesserocr'
    doOcr: boolean
    doTableStructure: boolean
    inputFormat: ('pdf' | 'html' | 'docx' | 'pptx')[]
    outputFormat: 'md' | 'json'
    includeImages: boolean
  }
}

// Docling-serve payload structure
interface DoclingServeRequest {
  options: {
    from_formats: string[]
    to_formats: string[]
    image_export_mode: string
    do_ocr: boolean
    force_ocr: boolean
    pdf_backend: string
    table_mode: string
    abort_on_error: boolean
    return_as_file: boolean
    do_table_structure: boolean
    include_images: boolean
    images_scale: number
    do_code_enrichment: boolean
    do_formula_enrichment: boolean
    do_picture_classification: boolean
    do_picture_description: boolean
  }
  sources: Array<{
    kind: string
    url: string
  }>
}

class DoclingParsePDFJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    url: string
    doclingSettings?: BergetDoclingRequest | DoclingServeRequest
    taskId?: string
    resultUrl?: string // For Berget AI
  }
}

function createRequestPayload(
  url: string,
): BergetDoclingRequest | DoclingServeRequest {


  //we use the local logic temporarily at all times since the berget internal endpoint uses the same endpoints.
  //const isLocal = docling.DOCLING_USE_LOCAL
  const isLocal = true;
  if (isLocal) {
    // Docling-serve payload structure
    const doclingServePayload: DoclingServeRequest = {
      options: {
        from_formats: ['pdf'],
        to_formats: ['md'],
        image_export_mode: 'placeholder',
        do_ocr: false,
        force_ocr: false,
        pdf_backend: 'dlparse_v4',
        table_mode: 'accurate',
        abort_on_error: false,
        return_as_file: false,
        do_table_structure: true,
        include_images: false,
        images_scale: 2,
        do_code_enrichment: false,
        do_formula_enrichment: false,
        do_picture_classification: false,
        do_picture_description: false,
      },
      sources: [
        {
          kind: 'http',
          url,
        },
      ],
    }
    return doclingServePayload
  } else {
    // Berget AI payload structure
    const bergetPayload: BergetDoclingRequest = {
      model: 'docling-v1',
      document: {
        url,
        type: 'document',
      },
      async: true,
      options: {
        inputFormat: ['pdf'],
        outputFormat: 'md',
        includeImages: false,
        doOcr: false,
        ocrMethod: 'easyocr',
        tableMode: 'accurate',
        doTableStructure: true,
      },
    }
    return bergetPayload
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const doclingParsePDF = new DiscordWorker(
  QUEUE_NAMES.DOCLING_PARSE_PDF,
  async (job: DoclingParsePDFJob) => {
    const { url, doclingSettings, taskId } = job.data

    try {
      if (taskId) {
        job.log(`Checking status of existing task: ${taskId}`)
        return await pollTaskAndGetResult(job, taskId)
      }

      // Add a small random delay (0-5 seconds) to stagger job starts and avoid thundering herd
      const staggerDelay = Math.floor(Math.random() * 5000) // 0-5000ms
      if (staggerDelay > 0) {
        job.log(`Staggering job start by ${staggerDelay}ms to avoid simultaneous API calls`)
        await sleep(staggerDelay)
      }

    
      const requestPayload = createRequestPayload(url)
      job.updateData({
        ...job.data,
        doclingSettings: requestPayload,
      })


      job.sendMessage('Starting PDF parsing with Docling (async mode)...')

      job.log('Submitting async task to Docling API...')

      try {
        job.log(`Making request to: ${docling.baseUrl}`)
        job.log(`With payload: ${JSON.stringify(job.data.doclingSettings)}`)

        //const isLocal = docling.DOCLING_USE_LOCAL
        //we use the local logic temporarily at all times since the berget internal endpoint uses the same endpoints.
        const isLocal = true;
        //const endpoint = isLocal
        //        ? `${docling.baseUrl}/convert/source/async`
        //        : `${docling.baseUrl}`
        //we use the local logic temporarily at all times since the berget internal endpoint uses the same endpoints.
        const endpoint = `${docling.baseUrl}/convert/source/async`
      

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        // Add authorization for Berget AI
        if (!isLocal && docling.BERGET_AI_TOKEN) {
          headers.authorization = `Bearer ${docling.BERGET_AI_TOKEN}`
        }

        job.log(
          `Using ${isLocal ? 'local docling-serve' : 'Berget AI'} endpoint: ${endpoint}`,
        )

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for initial request

        let startResponse
        try {
          startResponse = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(job.data.doclingSettings),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }

        job.log(
          `Response status: ${startResponse.status} ${startResponse.statusText}`,
        )

        if (!startResponse.ok) {
          try {
            const errorBody = await startResponse.text()
            job.log(`Error response body: ${errorBody}`)
            throw new Error(
              `Docling API responded with status: ${startResponse.status}`,
            )
          } catch (bodyError) {
            job.log(`Failed to read error response body: ${bodyError.message}`)
            throw new Error(
              `Docling API responded with status: ${startResponse.status}`,
            )
          }
        }

        const responseData = await startResponse.json()
        job.log(`Response: ${JSON.stringify(responseData)}`)

        let taskId: string
        let resultUrl: string | undefined

        if (isLocal) {
          // Docling-serve returns task_id
          taskId = responseData.task_id
          if (!taskId) {
            throw new Error(
              'No task_id returned from docling-serve async endpoint',
            )
          }
        } else {
          // Berget AI returns taskId and resultUrl
          taskId = responseData.taskId
          resultUrl = responseData.resultUrl
          if (!taskId) {
            job.log(`Full Berget response: ${JSON.stringify(responseData)}`)
            throw new Error('No taskId returned from Berget AI endpoint')
          }
        }

        job.updateData({
          ...job.data,
          taskId: taskId,
          resultUrl: resultUrl,
        })

        return await pollTaskAndGetResult(job, taskId)
      } catch (networkError) {
        job.log(
          `Network error details: ${JSON.stringify(
            {
              name: networkError.name,
              message: networkError.message,
              cause: networkError.cause,
              stack: networkError.stack,
            },
            null,
            2,
          )}`,
        )

        throw new Error(
          `Failed to connect to Docling API: ${networkError.message}`,
        )
      }
    } catch (error) {
      job.log('Error: ' + error)
      job.editMessage(
        `Failed to parse PDF: ${error.message || 'Unknown error'}`,
      )
      throw error
    }
  },
  { concurrency: 1, connection: redis, lockDuration: 30 * 60 * 1000 }, // Increased lock duration for async processing, allow 1 parallel jobs
)

async function pollTaskAndGetResult(
  job: DoclingParsePDFJob,
  taskId: string,
): Promise<{ markdown: string }> {
  const startTime = Date.now()
  //const isLocal = docling.DOCLING_USE_LOCAL

  //we use the local logic temporarily at all times since the berget internal endpoint uses the same endpoints.
  const isLocal = true;

  job.editMessage(`Parsing PDF... (Task ID: ${taskId})`)
  job.log(`Using ${isLocal ? 'docling-serve' : 'Berget AI'} polling`)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!isLocal && docling.BERGET_AI_TOKEN) {
    headers.authorization = `Bearer ${docling.BERGET_AI_TOKEN}`
  }

  if (isLocal) {
    // Docling-serve polling logic
    const baseUrl = docling.baseUrl
    const statusUrl = `${baseUrl}/status/poll/${taskId}`
    const resultUrl = `${baseUrl}/result/${taskId}`

    job.log(`Status URL: ${statusUrl}`)
    job.log(`Result URL: ${resultUrl}`)

    // Poll for the task status until it's complete
    let taskComplete = false
    while (!taskComplete) {
      job.log(`Polling task status: ${statusUrl}`)

      const statusResponse = await fetch(statusUrl, { headers })
      job.log(`Polling status ${statusResponse.status}`)

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        job.log(`Status check error: ${errorText}`)
        throw new Error(
          `Status check failed with status: ${statusResponse.status}`,
        )
      }

      const statusData = await statusResponse.json()
      job.log(`Status data: ${JSON.stringify(statusData)}`)

      if (statusData.task_status === 'success') {
        taskComplete = true
      } else if (statusData.task_status === 'failure') {
        throw new Error(`Task failed: ${JSON.stringify(statusData)}`)
      } else {
        // Task is still pending or processing
        await sleep(2000) // Wait 2 seconds before polling again
      }
    }

    job.log(`Fetching result from: ${resultUrl}`)
    const resultResponse = await fetch(resultUrl, { headers })

    if (!resultResponse.ok) {
      const errorText = await resultResponse.text()
      job.log(`Result fetch error: ${errorText}`)
      throw new Error(
        `Failed to fetch result with status: ${resultResponse.status}`,
      )
    }

    const resultData = await resultResponse.json()
    job.log(`Result data keys: ${Object.keys(resultData).join(', ')}`)

    const markdown = resultData.document?.md_content

    if (!markdown) {
      job.log(`Full result data: ${JSON.stringify(resultData, null, 2)}`)
      throw new Error('No markdown content found in result')
    }

    const totalTime = Math.floor((Date.now() - startTime) / 1000)
    job.editMessage(`PDF parsed successfully in ${totalTime}s`)
    job.log(`Task completed in ${totalTime}s`)

    return { markdown }
  } else {
    // Berget AI polling logic
    const resultUrl = job.data.resultUrl

    if (!resultUrl) {
      throw new Error('No result url provided.')
    }

    job.log(`Result URL: ${resultUrl}`)

    // Poll the result endpoint until completion
    while (true) {
      job.log(`Polling Berget AI result: ${resultUrl}`)

      const response = await fetch(resultUrl, {
        headers,
      })

      if (response.status === 200) {
        const result = await response.json()

        if (result.error) {
          throw new Error(`Berget AI error: ${result.error}`)
        }

        const markdown = result.content ?? ''

        if (!markdown) {
          job.log(`Full Berget result data: ${JSON.stringify(result, null, 2)}`)
          throw new Error('No content found in Berget AI result')
        }

        const totalTime = Math.floor((Date.now() - startTime) / 1000)
        const pages = result.usage?.pages || 'unknown'
        const characters = result.usage?.characters || 'unknown'

        job.editMessage(
          `PDF parsed successfully in ${totalTime}s (${pages} pages, ${characters} characters)`,
        )
        job.log(
          `Task completed in ${totalTime}s - Pages: ${pages}, Characters: ${characters}`,
        )
        return { markdown }
      } else if (response.status === 202) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2')
        console.log(
          `Job still processing, retrying in ${retryAfter} seconds...`,
        )
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
      } else {
        throw new Error(`Failed to get result: ${response.status}`)
      }
    }
  }
}

export default doclingParsePDF
