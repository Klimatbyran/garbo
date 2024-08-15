import { z } from 'zod'
import { EconomyCreateWithoutMetadataInputObjectSchema } from './EconomyCreateWithoutMetadataInput.schema'
import { EconomyUncheckedCreateWithoutMetadataInputObjectSchema } from './EconomyUncheckedCreateWithoutMetadataInput.schema'
import { EconomyCreateOrConnectWithoutMetadataInputObjectSchema } from './EconomyCreateOrConnectWithoutMetadataInput.schema'
import { EconomyWhereUniqueInputObjectSchema } from './EconomyWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyCreateNestedManyWithoutMetadataInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => EconomyCreateWithoutMetadataInputObjectSchema),
        z.lazy(() => EconomyCreateWithoutMetadataInputObjectSchema).array(),
        z.lazy(() => EconomyUncheckedCreateWithoutMetadataInputObjectSchema),
        z
          .lazy(() => EconomyUncheckedCreateWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => EconomyCreateOrConnectWithoutMetadataInputObjectSchema),
        z
          .lazy(() => EconomyCreateOrConnectWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => EconomyWhereUniqueInputObjectSchema),
        z.lazy(() => EconomyWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
  })
  .strict()

export const EconomyCreateNestedManyWithoutMetadataInputObjectSchema = Schema
