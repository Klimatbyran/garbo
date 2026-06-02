/**
 * When pipeline-api cached a PDF to S3, `job.data.url` is the S3 public URL and
 * `sourceUrl` is the original report link. For DB/UI we prefer the original HTTP(S)
 * link when present; otherwise use `url` (file uploads: S3; legacy link jobs: same as source).
 */
export function canonicalPublicReportUrl(data: {
  url: string
  sourceUrl?: string
}): string {
  const { url, sourceUrl } = data
  if (typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl.trim())) {
    return sourceUrl.trim()
  }
  return url
}
