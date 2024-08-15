import { z } from 'zod'
import { EmissionsCreateWithoutScope1InputObjectSchema } from './EmissionsCreateWithoutScope1Input.schema'
import { EmissionsUncheckedCreateWithoutScope1InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope1Input.schema'
import { EmissionsCreateOrConnectWithoutScope1InputObjectSchema } from './EmissionsCreateOrConnectWithoutScope1Input.schema'
import { EmissionsUpsertWithoutScope1InputObjectSchema } from './EmissionsUpsertWithoutScope1Input.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'
import { EmissionsUpdateWithoutScope1InputObjectSchema } from './EmissionsUpdateWithoutScope1Input.schema'
import { EmissionsUncheckedUpdateWithoutScope1InputObjectSchema } from './EmissionsUncheckedUpdateWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpdateOneRequiredWithoutScope1NestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => EmissionsCreateWithoutScope1InputObjectSchema),
          z.lazy(() => EmissionsUncheckedCreateWithoutScope1InputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => EmissionsCreateOrConnectWithoutScope1InputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => EmissionsUpsertWithoutScope1InputObjectSchema)
        .optional(),
      connect: z.lazy(() => EmissionsWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => EmissionsUpdateWithoutScope1InputObjectSchema),
          z.lazy(() => EmissionsUncheckedUpdateWithoutScope1InputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const EmissionsUpdateOneRequiredWithoutScope1NestedInputObjectSchema =
  Schema
