import { z } from 'zod'
import { IndustryGicsWhereUniqueInputObjectSchema } from './IndustryGicsWhereUniqueInput.schema'
import { IndustryGicsCreateWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateWithoutCompaniesInput.schema'
import { IndustryGicsUncheckedCreateWithoutCompaniesInputObjectSchema } from './IndustryGicsUncheckedCreateWithoutCompaniesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsCreateOrConnectWithoutCompaniesInput> =
  z
    .object({
      where: z.lazy(() => IndustryGicsWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => IndustryGicsCreateWithoutCompaniesInputObjectSchema),
        z.lazy(
          () => IndustryGicsUncheckedCreateWithoutCompaniesInputObjectSchema
        ),
      ]),
    })
    .strict()

export const IndustryGicsCreateOrConnectWithoutCompaniesInputObjectSchema =
  Schema
