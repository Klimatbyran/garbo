import { z } from 'zod'

/** Optional provenance fields on pipeline extraction outputs and save payloads. */
export const sourceReferenceFields = {
  sourceReference: z
    .string()
    .optional()
    .describe(
      'Where in the report this value came from, e.g. "p. 42" or "p. 42, GHG table"'
    ),
  pageNumber: z
    .number()
    .int()
    .optional()
    .describe('Report page number when known from <!-- PAGE: N --> markers'),
}

export const sourceReferenceSchema = z.object(sourceReferenceFields)
