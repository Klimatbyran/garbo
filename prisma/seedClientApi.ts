import type { PrismaClient } from '@prisma/client'
import { CLIENT_API_PERMISSION_CODES } from '../src/api/security/routePermissions'
import { hashClientApiSecret, parseClientApiKey } from '../src/lib/clientApiKeyCrypto'

const BASE_PERMISSION_CODES = [
  'api.companies.list',
  'api.companies.read',
  'api.companies.search',
] as const

function pepper(): string {
  return process.env.CLIENT_API_KEY_PEPPER ?? process.env.API_SECRET ?? ''
}

export async function seedClientApi(prisma: PrismaClient) {
  if (!pepper()) {
    console.warn(
      '[seed] Skipping client API keys: set API_SECRET (or CLIENT_API_KEY_PEPPER) so keys can be hashed consistently with the API runtime.'
    )
    return
  }

  for (const code of CLIENT_API_PERMISSION_CODES) {
    await prisma.clientApiPermission.upsert({
      where: { code },
      create: { code, label: code },
      update: { label: code },
    })
  }

  const allAccessRole = await prisma.clientApiRole.upsert({
    where: { slug: 'all_access' },
    create: {
      slug: 'all_access',
      label: 'All-access — full client API HTTP surface',
    },
    update: { label: 'All-access — full client API HTTP surface' },
  })

  const baseRole = await prisma.clientApiRole.upsert({
    where: { slug: 'base' },
    create: {
      slug: 'base',
      label: 'Base — company list, detail, search only',
    },
    update: { label: 'Base — company list, detail, search only' },
  })

  const allPermissions = await prisma.clientApiPermission.findMany()
  const idByCode = new Map(allPermissions.map((p) => [p.code, p.id]))

  await prisma.$transaction(async (tx) => {
    await tx.clientApiRolePermission.deleteMany({ where: { roleId: allAccessRole.id } })
    await tx.clientApiRolePermission.createMany({
      data: CLIENT_API_PERMISSION_CODES
        .map((code) => idByCode.get(code))
        .filter((id): id is string => id !== undefined)
        .map((permissionId) => ({ roleId: allAccessRole.id, permissionId })),
    })

    await tx.clientApiRolePermission.deleteMany({ where: { roleId: baseRole.id } })
    await tx.clientApiRolePermission.createMany({
      data: BASE_PERMISSION_CODES
        .map((code) => idByCode.get(code))
        .filter((id): id is string => id !== undefined)
        .map((permissionId) => ({ roleId: baseRole.id, permissionId })),
    })
  })

  const allAccessRaw = process.env.GARBO_ALL_ACCESS_API_KEY
  const baseRaw = process.env.GARBO_BASE_API_KEY

  if (allAccessRaw) {
    const parsed = parseClientApiKey(allAccessRaw.trim())
    if (!parsed) {
      console.warn(
        '[seed] GARBO_ALL_ACCESS_API_KEY has invalid format (expected garb_<lookup>.<secret>).'
      )
    } else {
      const secretHash = hashClientApiSecret(parsed.keyLookup, parsed.secretPart, pepper())
      await prisma.clientApiKey.upsert({
        where: { keyLookup: parsed.keyLookup },
        create: {
          name: 'Seed all-access',
          keyLookup: parsed.keyLookup,
          secretHash,
          roleId: allAccessRole.id,
        },
        update: { secretHash, roleId: allAccessRole.id, revokedAt: null },
      })
      console.log('[seed] Upserted all-access client API key from GARBO_ALL_ACCESS_API_KEY')
    }
  }

  if (baseRaw) {
    const parsed = parseClientApiKey(baseRaw.trim())
    if (!parsed) {
      console.warn(
        '[seed] GARBO_BASE_API_KEY has invalid format (expected garb_<lookup>.<secret>).'
      )
    } else {
      const secretHash = hashClientApiSecret(parsed.keyLookup, parsed.secretPart, pepper())
      await prisma.clientApiKey.upsert({
        where: { keyLookup: parsed.keyLookup },
        create: {
          name: 'Seed base',
          keyLookup: parsed.keyLookup,
          secretHash,
          roleId: baseRole.id,
        },
        update: { secretHash, roleId: baseRole.id, revokedAt: null },
      })
      console.log('[seed] Upserted base client API key from GARBO_BASE_API_KEY')
    }
  }

  if (!allAccessRaw && !baseRaw) {
    console.log(
      '[seed] No seed keys set — roles and permissions only. Set GARBO_ALL_ACCESS_API_KEY / GARBO_BASE_API_KEY to also seed keys.'
    )
  }
}
