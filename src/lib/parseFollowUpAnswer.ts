export function parseFollowUpAnswer(
  answer: string | undefined
): Record<string, unknown> | null {
  if (!answer) return null
  try {
    const parsed = JSON.parse(answer) as { value?: Record<string, unknown> }
    if (
      parsed.value &&
      typeof parsed.value === 'object' &&
      !Array.isArray(parsed.value)
    ) {
      return parsed.value
    }
    return null
  } catch {
    return null
  }
}

/**
 * Replaces the `value` of a followUp answer and keeps its `metadata`, so the
 * run archive still stores the prompt, timings and model for the job.
 */
export function withFollowUpValue(
  answer: string | undefined,
  value: Record<string, unknown>
): string {
  const parsed = answer ? (JSON.parse(answer) as Record<string, unknown>) : {}
  return JSON.stringify({ ...parsed, value })
}
