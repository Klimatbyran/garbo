import { User } from '@prisma/client'
import { prisma } from '../../lib/prisma'

/** Service client_id used by pipeline workers (`POST /auth/token`) and automated jobs. */
export const GARBO_SERVICE_CLIENT_ID = 'garbo'

export async function getOrCreateServiceBotUser(
  clientId: string = GARBO_SERVICE_CLIENT_ID
): Promise<User> {
  return prisma.user.upsert({
    where: { name: clientId },
    update: {
      bot: true,
      email: `${clientId}@klimatkollen.se`,
    },
    create: {
      name: clientId,
      email: `${clientId}@klimatkollen.se`,
      bot: true,
    },
  })
}
