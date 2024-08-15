import { z } from 'zod'
import { EmissionsCreateWithoutScope2InputObjectSchema } from './EmissionsCreateWithoutScope2Input.schema'
import { EmissionsUncheckedCreateWithoutScope2InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope2Input.schema'
import { EmissionsCreateOrConnectWithoutScope2InputObjectSchema } from './EmissionsCreateOrConnectWithoutScope2Input.schema'
import { EmissionsUpsertWithoutScope2InputObjectSchema } from './EmissionsUpsertWithoutScope2Input.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'
import { EmissionsUpdateWithoutScope2InputObjectSchema } from './EmissionsUpdateWithoutScope2Input.schema'
import { EmissionsUncheckedUpdateWithoutScope2InputObjectSchema } from './EmissionsUncheckedUpdateWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpdateOneRequiredWithoutScope2NestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => EmissionsCreateWithoutScope2InputObjectSchema),
          z.lazy(() => EmissionsUncheckedCreateWithoutScope2InputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => EmissionsCreateOrConnectWithoutScope2InputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => EmissionsUpsertWithoutScope2InputObjectSchema)
        .optional(),
      connect: z.lazy(() => EmissionsWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => EmissionsUpdateWithoutScope2InputObjectSchema),
          z.lazy(() => EmissionsUncheckedUpdateWithoutScope2InputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const EmissionsUpdateOneRequiredWithoutScope2NestedInputObjectSchema =
  Schema
