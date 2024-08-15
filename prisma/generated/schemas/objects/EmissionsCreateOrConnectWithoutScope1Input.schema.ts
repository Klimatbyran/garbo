import { z } from 'zod'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'
import { EmissionsCreateWithoutScope1InputObjectSchema } from './EmissionsCreateWithoutScope1Input.schema'
import { EmissionsUncheckedCreateWithoutScope1InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateOrConnectWithoutScope1Input> = z
  .object({
    where: z.lazy(() => EmissionsWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => EmissionsCreateWithoutScope1InputObjectSchema),
      z.lazy(() => EmissionsUncheckedCreateWithoutScope1InputObjectSchema),
    ]),
  })
  .strict()

export const EmissionsCreateOrConnectWithoutScope1InputObjectSchema = Schema
