import { z } from 'zod'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'
import { EmissionsCreateWithoutScope2InputObjectSchema } from './EmissionsCreateWithoutScope2Input.schema'
import { EmissionsUncheckedCreateWithoutScope2InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateOrConnectWithoutScope2Input> = z
  .object({
    where: z.lazy(() => EmissionsWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => EmissionsCreateWithoutScope2InputObjectSchema),
      z.lazy(() => EmissionsUncheckedCreateWithoutScope2InputObjectSchema),
    ]),
  })
  .strict()

export const EmissionsCreateOrConnectWithoutScope2InputObjectSchema = Schema
