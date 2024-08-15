import { z } from 'zod'
import { EmissionsCreateWithoutScope2InputObjectSchema } from './EmissionsCreateWithoutScope2Input.schema'
import { EmissionsUncheckedCreateWithoutScope2InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope2Input.schema'
import { EmissionsCreateOrConnectWithoutScope2InputObjectSchema } from './EmissionsCreateOrConnectWithoutScope2Input.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateNestedOneWithoutScope2Input> = z
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
    connect: z.lazy(() => EmissionsWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const EmissionsCreateNestedOneWithoutScope2InputObjectSchema = Schema
