import { z } from 'zod'
import { IndustryGicsUpdateWithoutCompaniesInputObjectSchema } from './IndustryGicsUpdateWithoutCompaniesInput.schema'
import { IndustryGicsUncheckedUpdateWithoutCompaniesInputObjectSchema } from './IndustryGicsUncheckedUpdateWithoutCompaniesInput.schema'
import { IndustryGicsCreateWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateWithoutCompaniesInput.schema'
import { IndustryGicsUncheckedCreateWithoutCompaniesInputObjectSchema } from './IndustryGicsUncheckedCreateWithoutCompaniesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsUpsertWithoutCompaniesInput> = z
  .object({
    update: z.union([
      z.lazy(() => IndustryGicsUpdateWithoutCompaniesInputObjectSchema),
      z.lazy(
        () => IndustryGicsUncheckedUpdateWithoutCompaniesInputObjectSchema
      ),
    ]),
    create: z.union([
      z.lazy(() => IndustryGicsCreateWithoutCompaniesInputObjectSchema),
      z.lazy(
        () => IndustryGicsUncheckedCreateWithoutCompaniesInputObjectSchema
      ),
    ]),
  })
  .strict()

export const IndustryGicsUpsertWithoutCompaniesInputObjectSchema = Schema
