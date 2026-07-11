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
