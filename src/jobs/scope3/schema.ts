import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '@/api/schemas'
import { sourceReferenceFields } from '@/lib/sourceReferenceSchema'

const scope3CategorySchema = z.object({
  originalUnitInReport: z.string(),
  unitNeedsConversionToMatchStandardUnit: z.boolean(),
  categoryMentionsInReport: z.union([z.array(z.string()), z.null()]),
  categoryNumbersInReport: z.union([z.array(z.string()), z.null()]),
  category: z.number().int().min(1).max(16),
  subValuesForCategory: z.union([z.array(z.number()), z.null()]),
  total: z.union([z.number(), z.null()]),
  unit: emissionUnitSchemaGarbo,
  ...sourceReferenceFields,
})

export const schema = z.object({
  scope3: z.array(
    z.object({
      year: z.number(),
      ...sourceReferenceFields,
      scope3: z.union([
        z.object({
          categories: z.array(scope3CategorySchema),
          statedTotalEmissions: z.union([
            z
              .object({
                total: z.union([z.number(), z.null()]),
                unit: emissionUnitSchemaGarbo,
                ...sourceReferenceFields,
              })
              .nullable(),
            z.null(),
          ]),
        }),
        z.null(),
      ]),
    })
  ),
})
