import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '@/api/schemas'

export const schema = z.object({
  scope3: z.array(
    z.object({
      year: z.number(),
      scope3: z.union([
        z.object({
          categories: z.array(
            z.object({
              originalUnitInReport: z.string(),
              unitNeedsConversionToMatchStandardUnit: z.boolean(),
              categoryMentionsInReport: z.union([
                z.array(z.string()),
                z.null(),
              ]),
              categoryNumbersInReport: z.union([z.array(z.string()), z.null()]),
              category: z.number().int().min(1).max(16),
              subValuesForCategory: z.union([z.array(z.number()), z.null()]),
              total: z.union([z.number(), z.null()]),
              unit: emissionUnitSchemaGarbo,
            })
          ),
          statedTotalEmissions: z.union([
            z.object({
              total: z.union([z.number(), z.null()]),
              unit: emissionUnitSchemaGarbo,
            }),
            z.null(),
          ]),
        }),
        z.null(),
      ]),
    })
  ),
})
