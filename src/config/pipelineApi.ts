import 'dotenv/config'

function readOptionalUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  try {
    return new URL(value.trim()).toString().replace(/\/$/, '')
  } catch {
    console.warn(
      '[pipelineApi] invalid PIPELINE_API_URL; prune hook disabled until URL is fixed'
    )
    return undefined
  }
}

export default {
  baseUrl: readOptionalUrl(process.env.PIPELINE_API_URL),
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN?.trim() || undefined,
}
