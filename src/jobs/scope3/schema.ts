import { z } from "zod"
import { emissionUnitSchemaGarbo } from "@/api/schemas"

export const schema = z.object({
  scope3: z.array(
    z.object({
      year: z.number(),
      scope3: z
        .object({
          categories: z
            .array(
              z.object({
                category: z.number().int(),
                total: z.number(),
                unit: emissionUnitSchemaGarbo,
              })
            )
            .nullable()
            .optional(),
          statedTotalEmissions: z
            .object({ total: z.number(), unit: emissionUnitSchemaGarbo })
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
    })
  ),
})

  