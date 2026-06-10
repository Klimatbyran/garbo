import { ReportingQualityResult } from '../schema'

export const expectedResults: Record<string, ReportingQualityResult> = {
  uses_ghg_categories: {
    reportingQuality: {
      usesGhgProtocolCategories: true,
      methodChanges: [],
      missingScopesExplained: null,
    },
  },
  no_ghg_categories: {
    reportingQuality: {
      usesGhgProtocolCategories: false,
      methodChanges: [],
      missingScopesExplained: true,
    },
  },
}
