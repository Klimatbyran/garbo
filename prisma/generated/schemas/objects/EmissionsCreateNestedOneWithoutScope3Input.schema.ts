import { z } from 'zod'
import { EmissionsCreateWithoutScope3InputObjectSchema } from './EmissionsCreateWithoutScope3Input.schema'
import { EmissionsUncheckedCreateWithoutScope3InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope3Input.schema'
import { EmissionsCreateOrConnectWithoutScope3InputObjectSchema } from './EmissionsCreateOrConnectWithoutScope3Input.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateNestedOneWithoutScope3Input> = z
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
    connect: z.lazy(() => EmissionsWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const EmissionsCreateNestedOneWithoutScope3InputObjectSchema = Schema
