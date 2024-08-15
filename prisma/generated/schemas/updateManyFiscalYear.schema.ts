import { z } from 'zod'
import { FiscalYearUpdateManyMutationInputObjectSchema } from './objects/FiscalYearUpdateManyMutationInput.schema'
import { FiscalYearWhereInputObjectSchema } from './objects/FiscalYearWhereInput.schema'

export const FiscalYearUpdateManySchema = z.object({
  data: FiscalYearUpdateManyMutationInputObjectSchema,
  where: FiscalYearWhereInputObjectSchema.optional(),
})
