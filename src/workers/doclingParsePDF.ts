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
  // Use local format controls the payload structure
  // This is independent of which API endpoint we hit
  const useLocalFormat = docling.DOCLING_USE_LOCAL

  if (useLocalFormat) {
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

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  job: DoclingParsePDFJob,
  maxRetries: number = 3,
  timeoutMs: number = 30000,
): Promise<Response> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error as Error
      const isLastAttempt = attempt === maxRetries

      if (!isLastAttempt) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = 1000 * Math.pow(2, attempt - 1)
        job.log(
          `Network error on attempt ${attempt}/${maxRetries}: ${lastError.message}. Retrying in ${delayMs}ms...`,
        )
        await sleep(delayMs)
      } else {
        job.log(
          `Network error on attempt ${attempt}/${maxRetries}: ${lastError.message}. No more retries.`,
        )
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries')
}

function shouldAddAuthHeader(
  useLocalFormat: boolean,
  useBackupAPI: boolean,
  apiToken: string | undefined,
): boolean {
  // No token available, can't add auth
  if (!apiToken) {
    return false
  }

  // Local format (docling-serve style)
  if (useLocalFormat) {
    // Local docling-serve typically doesn't need auth
    // BUT backup API might require it even with local format
    return useBackupAPI
  }

  // Berget format always requires authentication
  return true
}

// Configure limiter when using backup API to prevent overload
// Limiter applies across ALL worker instances (shared via Redis)
const workerOptions = {
  concurrency: 1,
  connection: redis,
  lockDuration: 30 * 60 * 1000,
  ...(docling.USE_BACKUP_API && {
    limiter: {
      max: 2, // Max 2 concurrent jobs across all worker instances
      duration: 1, // Per 1ms (essentially "at any given time")
    },
  }),
}

// Flag to log configuration once in the first job (appears in BullMQ logs)
let hasLoggedConfiguration = false

function logConfigurationOnce(job: DoclingParsePDFJob): void {
  if (hasLoggedConfiguration) {
    return
  }
  hasLoggedConfiguration = true
  job.log('📡 Docling configuration:')
  job.log(`  - Primary API URL: ${docling.baseUrl}`)
  job.log(`  - Use local format: ${docling.DOCLING_USE_LOCAL}`)
  job.log(`  - Use backup API: ${docling.USE_BACKUP_API}`)
  if (docling.USE_BACKUP_API) {
    job.log(`  - Backup API URL: ${docling.BACKUP_API_URL}`)
    job.log(`  - Backup auth header: ${docling.BACKUP_API_AUTH_HEADER}`)
  }
}

const doclingParsePDF = new DiscordWorker(
  QUEUE_NAMES.DOCLING_PARSE_PDF,
  async (job: DoclingParsePDFJob) => {
    const { url, doclingSettings, taskId } = job.data

    // Log configuration once (first job only) - appears in BullMQ logs
    logConfigurationOnce(job)

    try {
      if (taskId) {
        job.log(`Checking status of existing task: ${taskId}`)
        // When resuming a task, use current config settings
        const useBackupAPI = docling.USE_BACKUP_API
        const useLocalFormat = docling.DOCLING_USE_LOCAL
        return await pollTaskAndGetResult(
          job,
          taskId,
          useLocalFormat,
          useBackupAPI,
        )
      }

      // Add a small random delay (0-5 seconds) to stagger job starts and avoid thundering herd
      const staggerDelay = Math.floor(Math.random() * 5000) // 0-5000ms
      if (staggerDelay > 0) {
        job.log(
          `Staggering job start by ${staggerDelay}ms to avoid simultaneous API calls`,
        )
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
        // Determine which API to use
        const useBackupAPI = docling.USE_BACKUP_API
        const useLocalFormat = docling.DOCLING_USE_LOCAL

        // Select API endpoint and token
        const apiBaseUrl = useBackupAPI
          ? docling.BACKUP_API_URL
          : docling.baseUrl
        const apiToken = useBackupAPI
          ? docling.BACKUP_API_TOKEN
          : docling.BERGET_AI_TOKEN

        job.log(`Making request to: ${apiBaseUrl}`)
        job.log(`With payload: ${JSON.stringify(job.data.doclingSettings)}`)

        // Build endpoint URL - local format uses /convert/source/async
        const endpoint = useLocalFormat
          ? `${apiBaseUrl}/convert/source/async`
          : `${apiBaseUrl}`

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        // Add authorization based on format and API choice
        if (shouldAddAuthHeader(useLocalFormat, useBackupAPI, apiToken)) {
          headers.authorization = `Bearer ${apiToken}`
        }

        job.log(
          `Using ${useBackupAPI ? 'backup' : 'primary'} API (${useLocalFormat ? 'local format' : 'Berget format'}): ${endpoint}`,
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

        if (useLocalFormat) {
          // Local format returns task_id
          taskId = responseData.task_id
          if (!taskId) {
            throw new Error(
              'No task_id returned from docling-serve async endpoint',
            )
          }
        } else {
          // Berget format returns taskId and resultUrl
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

        return await pollTaskAndGetResult(
          job,
          taskId,
          useLocalFormat,
          useBackupAPI,
        )
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
  workerOptions,
)

async function pollTaskAndGetResult(
  job: DoclingParsePDFJob,
  taskId: string,
  useLocalFormat: boolean,
  useBackupAPI: boolean,
): Promise<{ markdown: string }> {
  const startTime = Date.now()

  job.editMessage(`Parsing PDF... (Task ID: ${taskId})`)
  job.log(`Using ${useLocalFormat ? 'local format' : 'Berget format'} polling`)

  // Select API endpoint and token (same logic as before)
  const apiBaseUrl = useBackupAPI ? docling.BACKUP_API_URL : docling.baseUrl
  const apiToken = useBackupAPI
    ? docling.BACKUP_API_TOKEN
    : docling.BERGET_AI_TOKEN

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add authorization based on format and API choice
  if (shouldAddAuthHeader(useLocalFormat, useBackupAPI, apiToken)) {
    headers.authorization = `Bearer ${apiToken}`
  }

  if (useLocalFormat) {
    // Local format polling logic (works with both primary and backup APIs)
    const statusUrl = `${apiBaseUrl}/status/poll/${taskId}`
    const resultUrl = `${apiBaseUrl}/result/${taskId}`

    job.log(`Status URL: ${statusUrl}`)
    job.log(`Result URL: ${resultUrl}`)

    // Poll for the task status until it's complete
    const maxPollingTime = 25 * 60 * 1000 // 25 minutes (less than lockDuration)
    const pollingStartTime = Date.now()
    let taskComplete = false
    while (!taskComplete) {
      // Check if we've exceeded max polling time
      if (Date.now() - pollingStartTime > maxPollingTime) {
        throw new Error(
          `Task polling timed out after ${maxPollingTime / 1000}s. Task may still be processing on the server.`,
        )
      }

      job.log(`Polling task status: ${statusUrl}`)

      const statusResponse = await fetchWithRetry(statusUrl, { headers }, job)
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
        job.log('Task complete, exiting polling loop')
        taskComplete = true
      } else if (statusData.task_status === 'failure') {
        throw new Error(`Task failed: ${JSON.stringify(statusData)}`)
      } else {
        // Task is still pending or processing
        job.log(
          `Task status is "${statusData.task_status}", sleeping for 2s before next poll`,
        )
        await sleep(2000)
        job.log('Sleep complete, starting next poll iteration')
      }
    }

    // Wait a moment for result to be fully available
    job.log('Task succeeded, waiting 1s before fetching result')
    await sleep(1000)

    job.log(`Fetching result from: ${resultUrl}`)
    const resultResponse = await fetchWithRetry(
      resultUrl,
      { headers },
      job,
      5,
      30000,
    ) // 5 retries with 30s timeout

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

      const response = await fetchWithRetry(resultUrl, { headers }, job)

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
