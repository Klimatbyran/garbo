import { z } from "zod"
import { emissionUnitSchemaGarbo } from "@/api/schemas"

export const schema = z.object({
    scope12: z.array(
      z.object({
        year: z.number(),
        scope1: z.union([
          z.object({
            total: z.number(),
            unit: emissionUnitSchemaGarbo,
          }),
          z.null()
        ]).optional(),
        scope2: z.union([
          z.object({
            mb: z.union([
              z.number({ description: 'Market-based scope 2 emissions' }),
              z.null()
            ]).optional(),
            lb: z.union([
              z.number({ description: 'Location-based scope 2 emissions' }),
              z.null()
            ]).optional(),
            unknown: z.union([
              z.number({ description: 'Unspecified Scope 2 emissions' }),
              z.null()
            ]).optional(),
            unit: emissionUnitSchemaGarbo,
          }).refine(({ mb, lb, unknown }) => mb || lb || unknown, {
            message:
              'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
          }),
          z.null()
        ]).optional(),
      })
    ),
  })
  