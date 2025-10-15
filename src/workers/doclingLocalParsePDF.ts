import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'
import redis from '../config/redis'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { createSafeFolderName } from '../lib/pathUtils'

class DoclingLocalParsePDFJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    url: string
  }
}

function getBaseUrl(): string {
  const url =
    process.env.DOCLING_LOCAL_URL ||
    process.env.DOCLING_URL ||
    'http://localhost:5001'
  return url.replace(/\/+$/, '')
}

const doclingLocalParsePDF = new DiscordWorker(
  QUEUE_NAMES.DOCLING_LOCAL_PARSE_PDF,
  async (job: DoclingLocalParsePDFJob) => {
    const { url } = job.data

    try {
      job.sendMessage('Starting PDF parsing with local Docling...')

      const baseUrl = getBaseUrl()
      const endpoint = `${baseUrl}/v1/convert/source`

      const payload = {
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
            headers: {},
          },
        ],
      }

      job.log('Calling local Docling: ' + endpoint)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // local service can take some time for larger PDFs
        signal: AbortSignal.timeout(6 * 60 * 1000),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(
          `Local Docling responded ${res.status}: ${res.statusText} ${text}`,
        )
      }

      const body = await res.json()
      const md: string | undefined = body?.document?.md_content
      const json: unknown = body?.document?.json_content

      if (!md || typeof md !== 'string' || !md.trim()) {
        throw new Error('Local Docling returned empty markdown content')
      }

      try {
        const safeFolder = createSafeFolderName(url)
        const outDir = path.join('output', 'docling-json', safeFolder)
        await mkdir(outDir, { recursive: true })
        const outFile = path.join(outDir, 'docling.json')
        await writeFile(outFile, JSON.stringify(json ?? {}, null, 2))
        job.log(`Saved Docling JSON to ${outFile}`)
      } catch (err) {
        job.log('Failed to save Docling JSON: ' + (err as Error).message)
      }

      job.editMessage('✅ Local Docling parsed PDF')

      return { markdown: md }
    } catch (error: unknown) {
      if (error instanceof Error) {
        job.log('Error: ' + error?.message)
        job.editMessage(
          `❌ Failed to parse PDF with local Docling: ${error?.message}`,
        )
        throw error
      }
    }
  },
  { concurrency: 1, connection: redis, lockDuration: 30 * 60 * 1000 },
)

export default doclingLocalParsePDF
