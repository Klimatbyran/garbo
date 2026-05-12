import type { PrismaClient } from '@prisma/client'
import { CLIENT_API_PERMISSION_CODES } from '../src/api/security/routePermissions'
import { hashClientApiSecret, parseClientApiKey } from '../src/lib/clientApiKeyCrypto'

const PARTNER_PERMISSION_CODES = [
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

  const firstPartyRole = await prisma.clientApiRole.upsert({
    where: { slug: 'first_party_fe' },
    create: {
      slug: 'first_party_fe',
      label: 'First-party — full client API HTTP surface',
    },
    update: { label: 'First-party — full client API HTTP surface' },
  })

  const partnerRole = await prisma.clientApiRole.upsert({
    where: { slug: 'partner_company_api' },
    create: {
      slug: 'partner_company_api',
      label: 'Partner — company list, detail, search only',
    },
    update: { label: 'Partner — company list, detail, search only' },
  })

  const allPermissions = await prisma.clientApiPermission.findMany()
  const idByCode = new Map(allPermissions.map((p) => [p.code, p.id]))

  await prisma.$transaction(async (tx) => {
    await tx.clientApiRolePermission.deleteMany({ where: { roleId: firstPartyRole.id } })
    await tx.clientApiRolePermission.createMany({
      data: CLIENT_API_PERMISSION_CODES
        .map((code) => idByCode.get(code))
        .filter((id): id is string => id !== undefined)
        .map((permissionId) => ({ roleId: firstPartyRole.id, permissionId })),
    })

    await tx.clientApiRolePermission.deleteMany({ where: { roleId: partnerRole.id } })
    await tx.clientApiRolePermission.createMany({
      data: PARTNER_PERMISSION_CODES
        .map((code) => idByCode.get(code))
        .filter((id): id is string => id !== undefined)
        .map((permissionId) => ({ roleId: partnerRole.id, permissionId })),
    })
  })

  const firstPartyRaw = process.env.GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY
  const partnerRaw = process.env.GARBO_SEED_PARTNER_CLIENT_API_KEY

  if (firstPartyRaw) {
    const parsed = parseClientApiKey(firstPartyRaw.trim())
    if (!parsed) {
      console.warn(
        '[seed] GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY has invalid format (expected garb_<lookup>.<secret>).'
      )
    } else {
      const secretHash = hashClientApiSecret(parsed.keyLookup, parsed.secretPart, pepper())
      await prisma.clientApiKey.upsert({
        where: { keyLookup: parsed.keyLookup },
        create: {
          name: 'Seed first-party',
          keyLookup: parsed.keyLookup,
          secretHash,
          roleId: firstPartyRole.id,
        },
        update: { secretHash, roleId: firstPartyRole.id, revokedAt: null },
      })
      console.log('[seed] Upserted first-party client API key from GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY')
    }
  }

  if (partnerRaw) {
    const parsed = parseClientApiKey(partnerRaw.trim())
    if (!parsed) {
      console.warn(
        '[seed] GARBO_SEED_PARTNER_CLIENT_API_KEY has invalid format (expected garb_<lookup>.<secret>).'
      )
    } else {
      const secretHash = hashClientApiSecret(parsed.keyLookup, parsed.secretPart, pepper())
      await prisma.clientApiKey.upsert({
        where: { keyLookup: parsed.keyLookup },
        create: {
          name: 'Seed partner',
          keyLookup: parsed.keyLookup,
          secretHash,
          roleId: partnerRole.id,
        },
        update: { secretHash, roleId: partnerRole.id, revokedAt: null },
      })
      console.log('[seed] Upserted partner client API key from GARBO_SEED_PARTNER_CLIENT_API_KEY')
    }
  }

  if (!firstPartyRaw && !partnerRaw) {
    console.log(
      '[seed] No seed keys set — roles and permissions only. Set GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY / GARBO_SEED_PARTNER_CLIENT_API_KEY to also seed keys.'
    )
  }
}
