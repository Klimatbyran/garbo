import { z } from 'zod'

export const wikidataIdSchema = z.string().regex(/Q\d+/)

export const wikidataIdParamSchema = z.object({ wikidataId: wikidataIdSchema })

export const garboEntityIdSchema = z.object({ id: z.string() })

/**
 * This allows reporting periods like 2022-2023
 */
export const yearSchema = z.string().regex(/\d{4}(?:-\d{4})?/)

export const yearParamSchema = z.object({ year: yearSchema })
