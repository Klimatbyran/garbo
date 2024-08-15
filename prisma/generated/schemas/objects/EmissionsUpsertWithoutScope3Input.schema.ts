import { z } from 'zod'
import { EmissionsUpdateWithoutScope3InputObjectSchema } from './EmissionsUpdateWithoutScope3Input.schema'
import { EmissionsUncheckedUpdateWithoutScope3InputObjectSchema } from './EmissionsUncheckedUpdateWithoutScope3Input.schema'
import { EmissionsCreateWithoutScope3InputObjectSchema } from './EmissionsCreateWithoutScope3Input.schema'
import { EmissionsUncheckedCreateWithoutScope3InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpsertWithoutScope3Input> = z
  .object({
    update: z.union([
      z.lazy(() => EmissionsUpdateWithoutScope3InputObjectSchema),
      z.lazy(() => EmissionsUncheckedUpdateWithoutScope3InputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => EmissionsCreateWithoutScope3InputObjectSchema),
      z.lazy(() => EmissionsUncheckedCreateWithoutScope3InputObjectSchema),
    ]),
  })
  .strict()

export const EmissionsUpsertWithoutScope3InputObjectSchema = Schema
