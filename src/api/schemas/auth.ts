import { z } from 'zod'

export const authenticationBodySchema = z.object({
  code: z.string().openapi('GitHub authorization code'),
})

export const authenticationResponseSchema = z.object({
  token: z.string().openapi('JWT authentication token'),
})
