import { z } from 'zod'
import { EmissionsUpdateWithoutScope1InputObjectSchema } from './EmissionsUpdateWithoutScope1Input.schema'
import { EmissionsUncheckedUpdateWithoutScope1InputObjectSchema } from './EmissionsUncheckedUpdateWithoutScope1Input.schema'
import { EmissionsCreateWithoutScope1InputObjectSchema } from './EmissionsCreateWithoutScope1Input.schema'
import { EmissionsUncheckedCreateWithoutScope1InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpsertWithoutScope1Input> = z
  .object({
    update: z.union([
      z.lazy(() => EmissionsUpdateWithoutScope1InputObjectSchema),
      z.lazy(() => EmissionsUncheckedUpdateWithoutScope1InputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => EmissionsCreateWithoutScope1InputObjectSchema),
      z.lazy(() => EmissionsUncheckedCreateWithoutScope1InputObjectSchema),
    ]),
  })
  .strict()

export const EmissionsUpsertWithoutScope1InputObjectSchema = Schema
