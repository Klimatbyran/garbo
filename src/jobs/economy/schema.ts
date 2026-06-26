import { z } from 'zod'

const monetaryValueSchema = z
  .object({
    value: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
  })
  .nullable()
  .optional()

export const schema = z.object({
  economy: z.array(
    z.object({
      year: z.number(),
      economy: z
        .object({
          turnover: monetaryValueSchema,
          revenue: monetaryValueSchema,
          employees: z
            .object({
              value: z.number().nullable().optional(),
              unit: z.enum(['FTE', 'EOY', 'AVG']).nullable().optional(),
            })
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
    })
  ),
})
