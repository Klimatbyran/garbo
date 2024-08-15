import { z } from 'zod'
import { MetadataCreateWithoutInitiativeInputObjectSchema } from './MetadataCreateWithoutInitiativeInput.schema'
import { MetadataUncheckedCreateWithoutInitiativeInputObjectSchema } from './MetadataUncheckedCreateWithoutInitiativeInput.schema'
import { MetadataCreateOrConnectWithoutInitiativeInputObjectSchema } from './MetadataCreateOrConnectWithoutInitiativeInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateNestedOneWithoutInitiativeInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutInitiativeInputObjectSchema),
          z.lazy(
            () => MetadataUncheckedCreateWithoutInitiativeInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => MetadataCreateOrConnectWithoutInitiativeInputObjectSchema)
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const MetadataCreateNestedOneWithoutInitiativeInputObjectSchema = Schema
