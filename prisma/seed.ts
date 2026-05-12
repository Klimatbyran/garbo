import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedGicsCodes } from '../scripts/add-gics'
import { CLIENT_API_PERMISSION_CODES } from '../src/api/security/routePermissions'
import { hashClientApiSecret, parseClientApiKey } from '../src/lib/clientApiKeyCrypto'

const prisma = new PrismaClient()

const PARTNER_PERMISSION_CODES = [
  'api.companies.list',
  'api.companies.read',
  'api.companies.search',
] as const

function pepper(): string {
  return (
    process.env.CLIENT_API_KEY_PEPPER ??
    process.env.PUBLIC_API_KEY_PEPPER ??
    process.env.API_SECRET ??
    ''
  )
}

function seedFirstPartyKeyRaw(): string | undefined {
  return (
    process.env.GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY ??
    process.env.GARBO_SEED_FIRST_PARTY_PUBLIC_API_KEY
  )
}

function seedPartnerKeyRaw(): string | undefined {
  return (
    process.env.GARBO_SEED_PARTNER_CLIENT_API_KEY ??
    process.env.GARBO_SEED_PARTNER_PUBLIC_API_KEY
  )
}

async function seedClientApi() {
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

  await prisma.clientApiRolePermission.deleteMany({
    where: { roleId: firstPartyRole.id },
  })
  for (const code of CLIENT_API_PERMISSION_CODES) {
    const permissionId = idByCode.get(code)
    if (!permissionId) continue
    await prisma.clientApiRolePermission.create({
      data: { roleId: firstPartyRole.id, permissionId },
    })
  }

  await prisma.clientApiRolePermission.deleteMany({
    where: { roleId: partnerRole.id },
  })
  for (const code of PARTNER_PERMISSION_CODES) {
    const permissionId = idByCode.get(code)
    if (!permissionId) continue
    await prisma.clientApiRolePermission.create({
      data: { roleId: partnerRole.id, permissionId },
    })
  }

  const firstPartyRaw = seedFirstPartyKeyRaw()
  const partnerRaw = seedPartnerKeyRaw()

  if (firstPartyRaw) {
    const parsed = parseClientApiKey(firstPartyRaw.trim())
    if (!parsed) {
      console.warn(
        '[seed] GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY (or legacy ..._PUBLIC_...) has invalid format (expected garb_<lookup>.<secret>).'
      )
    } else {
      const secretHash = hashClientApiSecret(
        parsed.keyLookup,
        parsed.secretPart,
        pepper()
      )
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
      console.log(
        '[seed] Upserted first-party client API key from env (GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY or legacy ..._PUBLIC_...)'
      )
    }
  }

  if (partnerRaw) {
    const parsed = parseClientApiKey(partnerRaw.trim())
    if (!parsed) {
      console.warn(
        '[seed] GARBO_SEED_PARTNER_CLIENT_API_KEY (or legacy ..._PUBLIC_...) has invalid format (expected garb_<lookup>.<secret>).'
      )
    } else {
      const secretHash = hashClientApiSecret(
        parsed.keyLookup,
        parsed.secretPart,
        pepper()
      )
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
      console.log(
        '[seed] Upserted partner client API key from env (GARBO_SEED_PARTNER_CLIENT_API_KEY or legacy ..._PUBLIC_...)'
      )
    }
  }

  if (!firstPartyRaw && !partnerRaw) {
    console.log(
      '[seed] No GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY / GARBO_SEED_PARTNER_CLIENT_API_KEY — roles and permissions only. Generate keys with format garb_<lookup>.<secret> and re-seed.'
    )
  }
}

async function seedUsers() {
  const users = [
    {
      email: 'hej@klimatkollen.se',
      name: 'Garbo (Klimatkollen)',
    },
    {
      email: 'alex@klimatkollen.se',
      name: 'Alex (Klimatkollen)',
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { name: user.name },
      create: user,
      update: user,
      select: { id: true },
    })
  }
}

const TAG_OPTIONS = [
  { slug: 'public', label: 'Publicly traded companies' },
  { slug: 'large-cap', label: 'Large cap' },
  { slug: 'mid-cap', label: 'Mid cap' },
  { slug: 'state-owned', label: 'State owned' },
  { slug: 'municipality-owned', label: 'Municipality owned' },
  { slug: 'private', label: 'Private' },
  { slug: 'small-cap', label: 'Small cap' },
  { slug: 'baltics', label: 'Baltic countries' },
] as const

async function seedTagOptions() {
  for (const option of TAG_OPTIONS) {
    await prisma.tagOption.upsert({
      where: { slug: option.slug },
      create: option,
      update: { label: option.label },
    })
  }
}

async function main() {
  await Promise.all([seedGicsCodes(), seedUsers(), seedTagOptions()])
  await seedClientApi()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
