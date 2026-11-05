// Retries for Chroma calls, and error messages that say what actually failed.
// The final error's message ends up as the BullMQ failedReason shown in goffer.

type Log = (msg: string) => void

/** Errors that won't go away by retrying (bad request, auth, missing collection). */
const NON_RETRYABLE = new Set([
  'ChromaClientError',
  'ChromaValueError',
  'InvalidArgumentError',
  'ChromaUnauthorizedError',
  'ChromaForbiddenError',
  'ChromaUniqueError',
  'ChromaNotFoundError',
  'InvalidCollectionError',
])

export function isRetryableChromaError(err: unknown): boolean {
  return !(err instanceof Error && NON_RETRYABLE.has(err.name))
}

/** Follows at most this many nested causes, in case of a cycle or a long chain. */
const MAX_CAUSE_DEPTH = 5

function describeCause(cause: unknown): string {
  if (!(cause instanceof Error)) return String(cause)
  return [cause.name, (cause as NodeJS.ErrnoException).code, cause.message]
    .filter(Boolean)
    .join(' ')
}

/**
 * "Name: message (cause: A → B)". The chromadb client turns most HTTP
 * failures into generic messages, and Node's fetch wraps the socket error
 * (e.g. ECONNREFUSED and the address) inside a "fetch failed" TypeError, so
 * the real clue is usually a few causes deep. String(err) drops all of them.
 */
export function describeChromaError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const base = `${err.name}: ${err.message}`

  const causes: string[] = []
  const seen = new Set<unknown>([err])
  let cause: unknown = err.cause
  while (
    cause !== undefined &&
    cause !== null &&
    !seen.has(cause) &&
    causes.length < MAX_CAUSE_DEPTH
  ) {
    seen.add(cause)
    causes.push(describeCause(cause))
    cause = cause instanceof Error ? cause.cause : undefined
  }

  return causes.length > 0 ? `${base} (cause: ${causes.join(' → ')})` : base
}

export async function withChromaRetry<T>(
  operation: string,
  fn: () => Promise<T>,
  log: Log,
  {
    maxAttempts = 5,
    sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
  }: { maxAttempts?: number; sleep?: (ms: number) => Promise<void> } = {}
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const reason = describeChromaError(err)
      const retryable = isRetryableChromaError(err)
      if (!retryable || attempt >= maxAttempts) {
        throw new Error(
          `ChromaDB ${operation} failed` +
            (retryable ? ` after ${attempt} attempts` : '') +
            `: ${reason}`,
          { cause: err }
        )
      }
      const delayMs =
        1000 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000)
      log(
        `ChromaDB ${operation} attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms: ${reason}`
      )
      await sleep(delayMs)
    }
  }
}
