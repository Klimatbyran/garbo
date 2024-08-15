import { z } from 'zod'
import { EmissionsCreateWithoutScope1InputObjectSchema } from './EmissionsCreateWithoutScope1Input.schema'
import { EmissionsUncheckedCreateWithoutScope1InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope1Input.schema'
import { EmissionsCreateOrConnectWithoutScope1InputObjectSchema } from './EmissionsCreateOrConnectWithoutScope1Input.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateNestedOneWithoutScope1Input> = z
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
    connect: z.lazy(() => EmissionsWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const EmissionsCreateNestedOneWithoutScope1InputObjectSchema = Schema
