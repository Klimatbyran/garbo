import { z } from 'zod'
import { FiscalYearWhereUniqueInputObjectSchema } from './objects/FiscalYearWhereUniqueInput.schema'
import { FiscalYearCreateInputObjectSchema } from './objects/FiscalYearCreateInput.schema'
import { FiscalYearUncheckedCreateInputObjectSchema } from './objects/FiscalYearUncheckedCreateInput.schema'
import { FiscalYearUpdateInputObjectSchema } from './objects/FiscalYearUpdateInput.schema'
import { FiscalYearUncheckedUpdateInputObjectSchema } from './objects/FiscalYearUncheckedUpdateInput.schema'

export const FiscalYearUpsertSchema = z.object({
  where: FiscalYearWhereUniqueInputObjectSchema,
  create: z.union([
    FiscalYearCreateInputObjectSchema,
    FiscalYearUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    FiscalYearUpdateInputObjectSchema,
    FiscalYearUncheckedUpdateInputObjectSchema,
  ]),
})
