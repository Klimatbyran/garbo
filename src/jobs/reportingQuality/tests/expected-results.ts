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
      missingScopesExplained: null,
    },
  },
  missing_scope_explained: {
    reportingQuality: {
      usesGhgProtocolCategories: null,
      methodChanges: [
        {
          year: 2021,
          description:
            'Emission factors for Scope 1 and Scope 2 were updated to the IEA 2023 dataset, restating prior year figures',
        },
      ],
      missingScopesExplained: true,
    },
  },
}
