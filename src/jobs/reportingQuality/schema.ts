import { z } from 'zod'

export const reportingQualitySchema = z.object({
  reportingQuality: z.object({
    /**
     * true  = company uses the 15 official GHG Protocol Scope 3 categories
     * false = company reports Scope 3 subcategories with custom labels, or reports Scope 3 as a single total only
     * null  = Scope 3 is not reported in this document
     */
    usesGhgProtocolCategories: z.boolean().nullable(),
    /**
     * Methodology changes explicitly mentioned in the document.
     * Each entry has the affected year (null if not specified) and a short description of the change.
     * Empty array = no methodology change mentioned.
     */
    methodChanges: z.array(
      z.object({
        year: z.number().nullable(),
        description: z.string(),
      })
    ),
    /**
     * null  = not applicable, all three scopes are reported (nothing missing)
     * true  = at least one scope is missing, and every missing scope has an explicit explanation
     * false = at least one scope is missing without explanation
     */
    missingScopesExplained: z.boolean().nullable(),
  }),
})

export type ReportingQualityResult = z.infer<typeof reportingQualitySchema>
