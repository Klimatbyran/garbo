import { z } from 'zod'
import { FiscalYearWhereUniqueInputObjectSchema } from './objects/FiscalYearWhereUniqueInput.schema'

export const FiscalYearDeleteOneSchema = z.object({
  where: FiscalYearWhereUniqueInputObjectSchema,
})
