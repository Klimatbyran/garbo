import { z } from 'zod'

import { buildLeiPrompt } from '../lib/reportLeiPreference'

/** @deprecated Use buildLeiPrompt({ preferSwedishEntities }) instead. */
export const leiPrompt = buildLeiPrompt({ preferSwedishEntities: true })

export { buildLeiPrompt }

export const leiSchema = z.object({
  lei: z.string(),
  legalName: z.string(),
})

export type LEI = z.infer<typeof leiSchema>['lei']

export type ParseLeiLlmResponseResult =
  | { success: true; data: z.infer<typeof leiSchema> }
  | { success: false; error: string }

export function parseLeiLlmResponse(
  response: string
): ParseLeiLlmResponseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `Invalid JSON response: ${message}`,
    }
  }

  const result = leiSchema.safeParse(parsed)
  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
    }
  }

  return { success: true, data: result.data }
}
