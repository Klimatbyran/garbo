import { z } from 'zod'
import { createMetadataSchema } from './request'

export const identifierTypeSchema = z.enum([
  'lei',
  'swedishOrgNumber',
  'isin',
  'cin',
  'duns',
])

export const companyIdentifierSchema = z.object({
  id: z.string().optional(),
  type: identifierTypeSchema,
  value: z.string(),
  verified: z.boolean().optional(),
})

export const postIdentifiersBodySchema = z
  .object({
    identifiers: z.array(companyIdentifierSchema),
  })
  .merge(createMetadataSchema)

export const updateIdentifierBodySchema = z
  .object({
    type: identifierTypeSchema,
    value: z.string(),
    verified: z.boolean().optional(),
  })
  .merge(createMetadataSchema)

export type IdentifierType = z.infer<typeof identifierTypeSchema>
export type CompanyIdentifier = z.infer<typeof companyIdentifierSchema>
export type PostIdentifiersBody = z.infer<typeof postIdentifiersBodySchema>
export type UpdateIdentifierBody = z.infer<typeof updateIdentifierBodySchema>
