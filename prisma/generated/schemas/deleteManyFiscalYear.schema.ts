import { z } from 'zod'
import { FiscalYearWhereInputObjectSchema } from './objects/FiscalYearWhereInput.schema'

export const FiscalYearDeleteManySchema = z.object({
  where: FiscalYearWhereInputObjectSchema.optional(),
})
