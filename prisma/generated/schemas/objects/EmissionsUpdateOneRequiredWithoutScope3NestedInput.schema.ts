import { z } from 'zod'
import { EmissionsCreateWithoutScope3InputObjectSchema } from './EmissionsCreateWithoutScope3Input.schema'
import { EmissionsUncheckedCreateWithoutScope3InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope3Input.schema'
import { EmissionsCreateOrConnectWithoutScope3InputObjectSchema } from './EmissionsCreateOrConnectWithoutScope3Input.schema'
import { EmissionsUpsertWithoutScope3InputObjectSchema } from './EmissionsUpsertWithoutScope3Input.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'
import { EmissionsUpdateWithoutScope3InputObjectSchema } from './EmissionsUpdateWithoutScope3Input.schema'
import { EmissionsUncheckedUpdateWithoutScope3InputObjectSchema } from './EmissionsUncheckedUpdateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpdateOneRequiredWithoutScope3NestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => EmissionsCreateWithoutScope3InputObjectSchema),
          z.lazy(() => EmissionsUncheckedCreateWithoutScope3InputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => EmissionsCreateOrConnectWithoutScope3InputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => EmissionsUpsertWithoutScope3InputObjectSchema)
        .optional(),
      connect: z.lazy(() => EmissionsWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => EmissionsUpdateWithoutScope3InputObjectSchema),
          z.lazy(() => EmissionsUncheckedUpdateWithoutScope3InputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const EmissionsUpdateOneRequiredWithoutScope3NestedInputObjectSchema =
  Schema
