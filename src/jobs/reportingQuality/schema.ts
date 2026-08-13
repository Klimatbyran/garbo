import { z } from 'zod'

const fragmentedValuesReportingSchema = z
  .enum(['NONE', 'PARTS_WITH_TOTAL', 'PARTS_ONLY_NO_TOTAL'])
  .nullable()

export const reportingQualitySchema = z.object({
  reportingQuality: z.object({
    /**
     * FULL          = company reports each of the 15 official GHG Protocol Scope 3 categories individually
     * GROUPED       = categories reported bundled into ranges (e.g. "Category 1-6: 56 tCO2e") rather than individually
     * CUSTOM_LABELS = company reports Scope 3 subcategories under its own labels, not mapped to the 15 official categories
     * SINGLE_TOTAL  = company reports Scope 3 as one total number only, no subcategory breakdown
     * null          = Scope 3 is not reported in this document
     */
    usesGhgProtocolCategories: z
      .enum(['FULL', 'GROUPED', 'CUSTOM_LABELS', 'SINGLE_TOTAL'])
      .nullable(),
    /**
     * Close-to-verbatim quote (in the language of the document) of how the company labels its Scope 3
     * breakdown, e.g. "Category 1-6: 56 tCO2e", "purchased categories for our wood", or just "coffee".
     * Not structured data — exists so a human reviewer can sanity-check usesGhgProtocolCategories above.
     * Null when there's no Scope 3 breakdown to quote (not reported, or reported as a single total).
     */
    categoryLabelsExample: z.string().nullable(),
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
    /**
     * Short free-text note on which scope(s) are missing and, if explained, a summary of the
     * company's stated reason. Null when missingScopesExplained is null.
     */
    missingScopesReason: z.string().nullable(),
    /**
     * true  = company explicitly calls its Scope 2 numbers "market-based" / "location-based" (or the
     *         local-language equivalent)
     * false = two Scope 2 numbers are given, but market-based/location-based is only inferable from
     *         context, never explicitly named
     * null  = Scope 2 is a single number with no market-based/location-based breakdown, or not reported
     */
    scope2MethodExplicit: z.boolean().nullable(),
    /**
     * Is Scope 1 broken into sub-parts (by facility, region, business unit, etc.) that a reviewer
     * should sanity-check? Same classification used for scope2FragmentedReporting below, and for
     * each category in scope3CategoryFragmentation further down:
     * NONE                 = reported as a clean total, no sub-part breakdown
     * PARTS_WITH_TOTAL     = broken into sub-parts, but the company also states the aggregate total —
     *                        low risk, since no summation is needed to get the total
     * PARTS_ONLY_NO_TOTAL  = only the sub-parts are given, with no stated total — the total must be
     *                        reconstructed by summing them, which is a real risk of extraction error
     * null                 = Scope 1 not reported / not enough quantitative data to assess
     */
    scope1FragmentedReporting: fragmentedValuesReportingSchema,
    /**
     * Close-to-verbatim quote of the Scope 1 fragmented breakdown observed (e.g. "Per facility:
     * Factory A 120, Factory B 80"). Null when scope1FragmentedReporting is NONE or null.
     */
    scope1FragmentedExample: z.string().nullable(),
    /** Same classification as scope1FragmentedReporting, but for Scope 2. */
    scope2FragmentedReporting: fragmentedValuesReportingSchema,
    /**
     * Close-to-verbatim quote of the Scope 2 fragmented breakdown observed (e.g. "Per country: Sweden
     * 1,240, Germany 860, Poland 430"). Null when scope2FragmentedReporting is NONE or null.
     */
    scope2FragmentedExample: z.string().nullable(),
    /**
     * Scope 3 fragmentation, tracked per category (1-16) instead of once for all of Scope 3, since a
     * document can fragment some categories and not others.
     * Listing Scope 3 broken into its 15/16 official categories is normal reporting, already covered
     * by usesGhgProtocolCategories above — that alone is not fragmentation. Only flag a category here
     * if that category's own number is itself split into sub-parts (e.g. Category 1 by material:
     * steel/plastic/aluminum) instead of one number for that category.
     * Only include an entry for a category that is fragmented this way (PARTS_WITH_TOTAL or PARTS_ONLY_NO_TOTAL).
     * Omit categories reported as a clean total — do not add NONE entries for them.
     * Return an empty array if no category is fragmented (the common case, even when all 15/16
     * categories are listed individually).
     */
    scope3CategoryFragmentation: z.array(
      z.object({
        /** The Scope 3 category number, 1-16. */
        category: z.number(),
        /**
         * PARTS_WITH_TOTAL    = this category is broken into sub-parts, but the company also states the
         *                       category total — low risk, no summation needed
         * PARTS_ONLY_NO_TOTAL = only the sub-parts are given for this category, no stated total — the
         *                       total must be reconstructed by summing them, flag for manual review
         */
        fragmentedReporting: z.enum([
          'PARTS_WITH_TOTAL',
          'PARTS_ONLY_NO_TOTAL',
        ]),
        /**
         * Close-to-verbatim quote of the fragmented breakdown for this category (e.g. "Category 1 by
         * material: steel 500, plastic 200, aluminum 90"), so a reviewer can verify the sum themselves.
         */
        example: z.string(),
      })
    ),
  }),
})

export type ReportingQualityResult = z.infer<typeof reportingQualitySchema>
