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
     * true  = all missing scopes have an explicit explanation — or no scopes are missing
     * false = at least one scope is absent without explanation
     * null  = all scopes are reported (nothing missing)
     */
    missingScopesExplained: z.boolean().nullable(),
  }),
})

export type ReportingQualityResult = z.infer<typeof reportingQualitySchema>
