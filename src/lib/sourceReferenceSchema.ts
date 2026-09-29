import { z } from 'zod'

/** Optional provenance fields on pipeline save payloads (pageNumber is write-path only). */
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
    .positive()
    .optional()
    .describe(
      'Report page number from Chroma chunk metadata / Docling JSON page lookup'
    ),
}
