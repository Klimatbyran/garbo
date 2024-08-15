import { z } from 'zod'
import { FiscalYearUpdateInputObjectSchema } from './objects/FiscalYearUpdateInput.schema'
import { FiscalYearUncheckedUpdateInputObjectSchema } from './objects/FiscalYearUncheckedUpdateInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './objects/FiscalYearWhereUniqueInput.schema'

export const FiscalYearUpdateOneSchema = z.object({
  data: z.union([
    FiscalYearUpdateInputObjectSchema,
    FiscalYearUncheckedUpdateInputObjectSchema,
  ]),
  where: FiscalYearWhereUniqueInputObjectSchema,
})
