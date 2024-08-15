import { z } from 'zod'
import { EmissionsUpdateWithoutScope2InputObjectSchema } from './EmissionsUpdateWithoutScope2Input.schema'
import { EmissionsUncheckedUpdateWithoutScope2InputObjectSchema } from './EmissionsUncheckedUpdateWithoutScope2Input.schema'
import { EmissionsCreateWithoutScope2InputObjectSchema } from './EmissionsCreateWithoutScope2Input.schema'
import { EmissionsUncheckedCreateWithoutScope2InputObjectSchema } from './EmissionsUncheckedCreateWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpsertWithoutScope2Input> = z
  .object({
    update: z.union([
      z.lazy(() => EmissionsUpdateWithoutScope2InputObjectSchema),
      z.lazy(() => EmissionsUncheckedUpdateWithoutScope2InputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => EmissionsCreateWithoutScope2InputObjectSchema),
      z.lazy(() => EmissionsUncheckedCreateWithoutScope2InputObjectSchema),
    ]),
  })
  .strict()

export const EmissionsUpsertWithoutScope2InputObjectSchema = Schema
