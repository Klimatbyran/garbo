/**
 * Compact failure text for reporting-period 500 responses.
 * Shown to pipeline workers / Validate via the JSON body (and thus BullMQ
 * failedReason). Internal staff route only — not Partner/public API.
 */
export function describePeriodSaveFailure(reason: unknown): string {
  if (!(reason instanceof Error)) {
    return String(reason).replace(/\s+/g, ' ').trim().slice(0, 500)
  }

  const maybeCode = (reason as unknown as { code?: unknown }).code
  const errorCode = typeof maybeCode === 'string' ? maybeCode : undefined

  // Outside production Prisma dumps a long invocation preamble; keep the
  // useful tail (constraint text) as well as the head when truncating.
  const collapsed = reason.message.replace(/\s+/g, ' ').trim()
  const message =
    collapsed.length <= 500
      ? collapsed
      : `${collapsed.slice(0, 240)} … ${collapsed.slice(-240)}`

  return errorCode ? `${message} [${errorCode}]` : message
}
