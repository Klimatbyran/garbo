import { z } from 'zod'
import { IndustryGicsCreateWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateWithoutCompaniesInput.schema'
import { IndustryGicsUncheckedCreateWithoutCompaniesInputObjectSchema } from './IndustryGicsUncheckedCreateWithoutCompaniesInput.schema'
import { IndustryGicsCreateOrConnectWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateOrConnectWithoutCompaniesInput.schema'
import { IndustryGicsWhereUniqueInputObjectSchema } from './IndustryGicsWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsCreateNestedOneWithoutCompaniesInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => IndustryGicsCreateWithoutCompaniesInputObjectSchema),
          z.lazy(
            () => IndustryGicsUncheckedCreateWithoutCompaniesInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => IndustryGicsCreateOrConnectWithoutCompaniesInputObjectSchema
        )
        .optional(),
      connect: z
        .lazy(() => IndustryGicsWhereUniqueInputObjectSchema)
        .optional(),
    })
    .strict()

export const IndustryGicsCreateNestedOneWithoutCompaniesInputObjectSchema =
  Schema
