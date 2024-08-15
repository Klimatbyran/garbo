import { z } from 'zod'
import { EmissionsWhereUniqueInputObjectSchema } from './EmissionsWhereUniqueInput.schema'
import { EmissionsCreateWithoutScope3InputObjectSchema } from './EmissionsCreateWithoutScope3Input.schema'
import { EmissionsUncheckedCreateWithoutScope3InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateOrConnectWithoutScope3Input> = z
  .object({
    where: z.lazy(() => EmissionsWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => EmissionsCreateWithoutScope3InputObjectSchema),
      z.lazy(() => EmissionsUncheckedCreateWithoutScope3InputObjectSchema),
    ]),
  })
  .strict()

export const EmissionsCreateOrConnectWithoutScope3InputObjectSchema = Schema
