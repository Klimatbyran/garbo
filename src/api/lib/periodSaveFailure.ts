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
  const prismaCode = typeof maybeCode === 'string' ? maybeCode : undefined

  const message = reason.message.replace(/\s+/g, ' ').trim().slice(0, 500)
  return prismaCode ? `${message} [${prismaCode}]` : message
}
