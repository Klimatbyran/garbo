import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '@/api/schemas'

export const schema = z.object({
  totalEmissions: z.array(
    z.object({
      year: z.number(),
      statedTotalEmissions: z
        .union([
          z
            .object({
              mentionOfLocationBasedOrMarketBased: z
                .union([z.array(z.string()), z.null()])
                .optional(),
              explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z
                .string()
                .nullable()
                .optional(),
              mb: z
                .union([
                  z.number({
                    description: 'Market-based stated total emissions',
                  }),
                  z.null(),
                ])
                .optional(),
              lb: z
                .union([
                  z.number({
                    description: 'Location-based stated total emissions',
                  }),
                  z.null(),
                ])
                .optional(),
              unknown: z
                .union([
                  z.number({
                    description: 'Stated total with unspecified scope 2 method',
                  }),
                  z.null(),
                ])
                .optional(),
              unit: emissionUnitSchemaGarbo,
            })
            .refine(({ mb, lb, unknown }) => mb || lb || unknown, {
              message: 'At least one of `mb`, `lb`, `unknown` must be provided',
            }),
          z.null(),
        ])
        .optional(),
    })
  ),
})
