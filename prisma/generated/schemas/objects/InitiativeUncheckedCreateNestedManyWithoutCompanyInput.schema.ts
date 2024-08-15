import { z } from 'zod'
import { InitiativeCreateWithoutCompanyInputObjectSchema } from './InitiativeCreateWithoutCompanyInput.schema'
import { InitiativeUncheckedCreateWithoutCompanyInputObjectSchema } from './InitiativeUncheckedCreateWithoutCompanyInput.schema'
import { InitiativeCreateOrConnectWithoutCompanyInputObjectSchema } from './InitiativeCreateOrConnectWithoutCompanyInput.schema'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUncheckedCreateNestedManyWithoutCompanyInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => InitiativeCreateWithoutCompanyInputObjectSchema),
          z.lazy(() => InitiativeCreateWithoutCompanyInputObjectSchema).array(),
          z.lazy(
            () => InitiativeUncheckedCreateWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => InitiativeUncheckedCreateWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => InitiativeCreateOrConnectWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => InitiativeCreateOrConnectWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const InitiativeUncheckedCreateNestedManyWithoutCompanyInputObjectSchema =
  Schema
