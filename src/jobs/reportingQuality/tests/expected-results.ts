import { ReportingQualityResult } from '../schema'

export const expectedResults: Record<string, ReportingQualityResult> = {
  uses_ghg_categories: {
    reportingQuality: {
      usesGhgProtocolCategories: 'FULL',
      categoryLabelsExample:
        'Category 1: Purchased goods and services; Category 11: Use of sold products',
      methodChanges: [],
      missingScopesExplained: null,
      missingScopesReason: null,
      scope2MethodExplicit: true,
      scope1FragmentedReporting: 'NONE',
      scope1FragmentedExample: null,
      scope2FragmentedReporting: 'NONE',
      scope2FragmentedExample: null,
      scope3CategoryFragmentation: [],
    },
  },
  no_ghg_categories: {
    reportingQuality: {
      usesGhgProtocolCategories: 'CUSTOM_LABELS',
      categoryLabelsExample:
        'Upstream logistics; Business travel; Employee commuting; Product use phase; Product end-of-life',
      methodChanges: [],
      missingScopesExplained: null,
      missingScopesReason: null,
      scope2MethodExplicit: true,
      scope1FragmentedReporting: 'NONE',
      scope1FragmentedExample: null,
      scope2FragmentedReporting: 'NONE',
      scope2FragmentedExample: null,
      scope3CategoryFragmentation: [],
    },
  },
  missing_scope_explained: {
    reportingQuality: {
      usesGhgProtocolCategories: null,
      categoryLabelsExample: null,
      methodChanges: [
        {
          year: 2021,
          description:
            'Emission factors for Scope 1 and Scope 2 were updated to the IEA 2023 dataset, restating prior year figures',
        },
      ],
      missingScopesExplained: true,
      missingScopesReason:
        'Scope 3 not reported; company lacks supply chain data and plans to begin reporting once its supplier engagement program is complete in 2025.',
      scope2MethodExplicit: true,
      scope1FragmentedReporting: 'NONE',
      scope1FragmentedExample: null,
      scope2FragmentedReporting: 'NONE',
      scope2FragmentedExample: null,
      scope3CategoryFragmentation: [],
    },
  },
  fragmented_values: {
    reportingQuality: {
      usesGhgProtocolCategories: 'FULL',
      categoryLabelsExample:
        'Category 1: Purchased goods and services; Category 11: Use of sold products',
      methodChanges: [],
      missingScopesExplained: null,
      missingScopesReason: null,
      scope2MethodExplicit: true,
      scope1FragmentedReporting: 'NONE',
      scope1FragmentedExample: null,
      scope2FragmentedReporting: 'PARTS_ONLY_NO_TOTAL',
      scope2FragmentedExample:
        'Per country: Sweden 1,240 tCO2e, Germany 860 tCO2e, Poland 430 tCO2e',
      scope3CategoryFragmentation: [],
    },
  },
  scope3_category_fragmented: {
    reportingQuality: {
      usesGhgProtocolCategories: 'FULL',
      categoryLabelsExample:
        'Category 1: Purchased goods and services; Category 11: Use of sold products',
      methodChanges: [],
      missingScopesExplained: null,
      missingScopesReason: null,
      scope2MethodExplicit: true,
      scope1FragmentedReporting: 'NONE',
      scope1FragmentedExample: null,
      scope2FragmentedReporting: 'NONE',
      scope2FragmentedExample: null,
      scope3CategoryFragmentation: [
        {
          category: 1,
          fragmentedReporting: 'PARTS_ONLY_NO_TOTAL',
          example:
            'Category 1 by material: Steel 500 tCO2e, Plastic 200 tCO2e, Aluminum 90 tCO2e',
        },
        {
          category: 11,
          fragmentedReporting: 'PARTS_WITH_TOTAL',
          example:
            'Category 11 by product line: Line A 60,000 tCO2e, Line B 40,000 tCO2e, Total Category 11: 100,000 tCO2e',
        },
      ],
    },
  },
  scope3_repeated_category_rows: {
    reportingQuality: {
      usesGhgProtocolCategories: 'FULL',
      categoryLabelsExample:
        'Category 1: Raw materials, Fabric production, Garment manufacturing, Packaging; Category 11: Use of sold products',
      methodChanges: [],
      missingScopesExplained: null,
      missingScopesReason: null,
      scope2MethodExplicit: true,
      scope1FragmentedReporting: 'NONE',
      scope1FragmentedExample: null,
      scope2FragmentedReporting: 'NONE',
      scope2FragmentedExample: null,
      scope3CategoryFragmentation: [
        {
          category: 1,
          fragmentedReporting: 'PARTS_ONLY_NO_TOTAL',
          example:
            'Category 1: Raw materials 1,180,000, Fabric production 3,872,000, Garment manufacturing 280,000, Packaging 110,000',
        },
      ],
    },
  },
}
