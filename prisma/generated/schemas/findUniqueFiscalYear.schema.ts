import { z } from 'zod'
import { FiscalYearWhereUniqueInputObjectSchema } from './objects/FiscalYearWhereUniqueInput.schema'

export const FiscalYearFindUniqueSchema = z.object({
  where: FiscalYearWhereUniqueInputObjectSchema,
})
