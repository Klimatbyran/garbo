import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '../api/schemas'

export const scope3CategoryAnalysisSchema = z.object({
  analysis: z.object({
    estimatedEmissions: z.object({
      value: z.number(),
      unit: emissionUnitSchemaGarbo,
      confidence: z.number(),
    }),
    reasoning: z.string(),
    methodology: z.string(),
    dataGaps: z.array(z.string()),
    recommendations: z.array(z.string()),
    relevantFactors: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
        impact: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      })
    ),
  }),
})

export type Scope3CategoryAnalysis = z.infer<
  typeof scope3CategoryAnalysisSchema
>
