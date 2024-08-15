import { z } from 'zod'
import { IndustryGicsCreateWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateWithoutCompaniesInput.schema'
import { IndustryGicsUncheckedCreateWithoutCompaniesInputObjectSchema } from './IndustryGicsUncheckedCreateWithoutCompaniesInput.schema'
import { IndustryGicsCreateOrConnectWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateOrConnectWithoutCompaniesInput.schema'
import { IndustryGicsUpsertWithoutCompaniesInputObjectSchema } from './IndustryGicsUpsertWithoutCompaniesInput.schema'
import { IndustryGicsWhereUniqueInputObjectSchema } from './IndustryGicsWhereUniqueInput.schema'
import { IndustryGicsUpdateWithoutCompaniesInputObjectSchema } from './IndustryGicsUpdateWithoutCompaniesInput.schema'
import { IndustryGicsUncheckedUpdateWithoutCompaniesInputObjectSchema } from './IndustryGicsUncheckedUpdateWithoutCompaniesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsUpdateOneWithoutCompaniesNestedInput> =
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
      upsert: z
        .lazy(() => IndustryGicsUpsertWithoutCompaniesInputObjectSchema)
        .optional(),
      disconnect: z.boolean().optional(),
      delete: z.boolean().optional(),
      connect: z
        .lazy(() => IndustryGicsWhereUniqueInputObjectSchema)
        .optional(),
      update: z
        .union([
          z.lazy(() => IndustryGicsUpdateWithoutCompaniesInputObjectSchema),
          z.lazy(
            () => IndustryGicsUncheckedUpdateWithoutCompaniesInputObjectSchema
          ),
        ])
        .optional(),
    })
    .strict()

export const IndustryGicsUpdateOneWithoutCompaniesNestedInputObjectSchema =
  Schema
