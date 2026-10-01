import type { PrismaClient } from '@prisma/client'
import { CLIENT_API_PERMISSION_CODES } from '../src/api/security/routePermissions'
import {
  hashClientApiSecret,
  parseClientApiKey,
} from '../src/lib/clientApiKeyCrypto'

/**
 * Canonical Unearth role slugs (shared DB). Garbo no longer seeds the legacy
 * `all_access` / `company_data` roles — those are migrated away by Unearth seed
 * and by {@link migrateLegacyClientApiRoles} below.
 */
const CANONICAL_ROLE_DEFS = [
  {
    slug: 'all-access',
    label: 'Full access — partner + integration client API',
  },
  {
    slug: 'partner',
    label: 'Partner API — company list, detail, search, and export',
  },
  {
    slug: 'partner-trial',
    label:
      'Partner trial — companies list/search/read, Sweden only, 7-day expiry',
  },
  {
    slug: 'integration',
    label: 'Integration API — first-party Klimatkollen / Validate routes',
  },
] as const

const LEGACY_ROLE_MIGRATIONS: ReadonlyArray<{
  fromSlug: string
  toSlug: string
}> = [
  { fromSlug: 'all_access', toSlug: 'all-access' },
  { fromSlug: 'company_data', toSlug: 'partner' },
]

const PARTNER_TRIAL_PERMISSION_CODES = [
  'api.companies.list',
  'api.companies.read',
  'api.companies.search',
] as const

function pepper(): string {
  return process.env.CLIENT_API_KEY_PEPPER ?? process.env.API_SECRET ?? ''
}

async function ensurePermission(prisma: PrismaClient, code: string) {
  await prisma.clientApiPermission.upsert({
    where: { code },
    create: { code, label: code },
    update: { label: code },
  })
}

async function grantPermissionsAdditive(
  prisma: PrismaClient,
  roleId: string,
  codes: readonly string[]
) {
  const permissions = await prisma.clientApiPermission.findMany({
    where: { code: { in: [...codes] } },
  })
  for (const permission of permissions) {
    await prisma.clientApiRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
      create: { roleId, permissionId: permission.id },
      update: {},
    })
  }
}

async function setExactPermissions(
  prisma: PrismaClient,
  roleId: string,
  codes: readonly string[]
) {
  const permissions = await prisma.clientApiPermission.findMany({
    where: { code: { in: [...codes] } },
  })
  await prisma.clientApiRolePermission.deleteMany({
    where: {
      roleId,
      permissionId: { notIn: permissions.map((p) => p.id) },
    },
  })
  for (const permission of permissions) {
    await prisma.clientApiRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
      create: { roleId, permissionId: permission.id },
      update: {},
    })
  }
}

async function migrateLegacyClientApiRoles(prisma: PrismaClient) {
  for (const { fromSlug, toSlug } of LEGACY_ROLE_MIGRATIONS) {
    const fromRole = await prisma.clientApiRole.findUnique({
      where: { slug: fromSlug },
      select: { id: true },
    })
    const toRole = await prisma.clientApiRole.findUnique({
      where: { slug: toSlug },
      select: { id: true },
    })
    if (!fromRole || !toRole) continue

    const moved = await prisma.clientApiKey.updateMany({
      where: { roleId: fromRole.id },
      data: { roleId: toRole.id },
    })
    if (moved.count > 0) {
      console.log(
        `[seed] Migrated ${moved.count} client API key(s) from "${fromSlug}" → "${toSlug}"`
      )
    }

    await prisma.clientApiRolePermission.deleteMany({
      where: { roleId: fromRole.id },
    })
    await prisma.clientApiRole.delete({ where: { id: fromRole.id } })
    console.log(`[seed] Removed legacy client API role "${fromSlug}"`)
  }
}

async function upsertKeyFromEnv(
  prisma: PrismaClient,
  envName: string,
  roleSlug: string,
  displayName: string
) {
  const raw = process.env[envName]?.trim()
  if (!raw) return

  const parsed = parseClientApiKey(raw)
  if (!parsed) {
    console.warn(
      `[seed] ${envName} has invalid format (expected garb_<lookup>.<secret>).`
    )
    return
  }

  const role = await prisma.clientApiRole.findUnique({
    where: { slug: roleSlug },
    select: { id: true },
  })
  if (!role) {
    console.warn(`[seed] Role "${roleSlug}" missing; skip ${envName}`)
    return
  }

  const secretHash = hashClientApiSecret(
    parsed.keyLookup,
    parsed.secretPart,
    pepper()
  )
  await prisma.clientApiKey.upsert({
    where: { keyLookup: parsed.keyLookup },
    create: {
      name: displayName,
      keyLookup: parsed.keyLookup,
      secretHash,
      roleId: role.id,
    },
    update: { secretHash, roleId: role.id, revokedAt: null },
  })
  console.log(`[seed] Upserted client API key from ${envName} → ${roleSlug}`)
}

/**
 * Align Garbo with Unearth client API roles on the shared DB.
 * Does not wipe Unearth permission sets on `all-access` / `integration` —
 * only ensures Garbo-owned permission codes exist and are granted additively.
 */
export async function seedClientApi(prisma: PrismaClient) {
  if (!pepper()) {
    console.warn(
      '[seed] Skipping client API keys: set API_SECRET (or CLIENT_API_KEY_PEPPER) so keys can be hashed consistently with the API runtime.'
    )
    return
  }

  for (const code of CLIENT_API_PERMISSION_CODES) {
    await ensurePermission(prisma, code)
  }

  for (const def of CANONICAL_ROLE_DEFS) {
    await prisma.clientApiRole.upsert({
      where: { slug: def.slug },
      create: { slug: def.slug, label: def.label },
      update: { label: def.label },
    })
  }

  const allAccess = await prisma.clientApiRole.findUniqueOrThrow({
    where: { slug: 'all-access' },
  })
  const partner = await prisma.clientApiRole.findUniqueOrThrow({
    where: { slug: 'partner' },
  })
  const partnerTrial = await prisma.clientApiRole.findUniqueOrThrow({
    where: { slug: 'partner-trial' },
  })
  const integration = await prisma.clientApiRole.findUniqueOrThrow({
    where: { slug: 'integration' },
  })

  // Additive: never delete Unearth-granted permissions from these roles.
  await grantPermissionsAdditive(
    prisma,
    allAccess.id,
    CLIENT_API_PERMISSION_CODES
  )
  await grantPermissionsAdditive(prisma, integration.id, [
    'api.internal.queue_archive',
  ])
  // Partner / trial: Garbo only knows company list/read/search (+ trial has no export).
  await grantPermissionsAdditive(prisma, partner.id, [
    'api.companies.list',
    'api.companies.read',
    'api.companies.search',
  ])
  await setExactPermissions(
    prisma,
    partnerTrial.id,
    PARTNER_TRIAL_PERMISSION_CODES
  )

  await migrateLegacyClientApiRoles(prisma)

  await upsertKeyFromEnv(
    prisma,
    'GARBO_BASE_API_KEY',
    'integration',
    'Garbo integration (seed)'
  )
  await upsertKeyFromEnv(
    prisma,
    'GARBO_ALL_ACCESS_API_KEY',
    'all-access',
    'Garbo all-access (seed)'
  )

  if (
    !process.env.GARBO_ALL_ACCESS_API_KEY &&
    !process.env.GARBO_BASE_API_KEY
  ) {
    console.log(
      '[seed] No seed keys set — roles and permissions only. Set GARBO_ALL_ACCESS_API_KEY / GARBO_BASE_API_KEY to also seed keys.'
    )
  }
}
