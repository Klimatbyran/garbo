import { z } from 'zod'
import { FiscalYearCreateInputObjectSchema } from './objects/FiscalYearCreateInput.schema'
import { FiscalYearUncheckedCreateInputObjectSchema } from './objects/FiscalYearUncheckedCreateInput.schema'

export const FiscalYearCreateOneSchema = z.object({
  data: z.union([
    FiscalYearCreateInputObjectSchema,
    FiscalYearUncheckedCreateInputObjectSchema,
  ]),
})
