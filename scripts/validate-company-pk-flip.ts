import { prisma } from '../src/lib/prisma'

type OrphanRow = { table: string; count: bigint }

async function main() {
  const orphanChecks = await prisma.$queryRaw<OrphanRow[]>`
    SELECT 'BaseYear' AS table, COUNT(*)::bigint AS count
    FROM "BaseYear" child
    LEFT JOIN "Company" company ON child."companyId" = company."id"
    WHERE company."id" IS NULL
    UNION ALL
    SELECT 'Industry', COUNT(*)::bigint
    FROM "Industry" child
    LEFT JOIN "Company" company ON child."companyId" = company."id"
    WHERE company."id" IS NULL
    UNION ALL
    SELECT 'ReportingPeriod', COUNT(*)::bigint
    FROM "ReportingPeriod" child
    LEFT JOIN "Company" company ON child."companyId" = company."id"
    WHERE company."id" IS NULL
    UNION ALL
    SELECT 'Goal', COUNT(*)::bigint
    FROM "Goal" child
    LEFT JOIN "Company" company ON child."companyId" = company."id"
    WHERE company."id" IS NULL
    UNION ALL
    SELECT 'Initiative', COUNT(*)::bigint
    FROM "Initiative" child
    LEFT JOIN "Company" company ON child."companyId" = company."id"
    WHERE company."id" IS NULL
    UNION ALL
    SELECT 'Description', COUNT(*)::bigint
    FROM "Description" child
    LEFT JOIN "Company" company ON child."companyId" = company."id"
    WHERE company."id" IS NULL
    UNION ALL
    SELECT 'CompanyReport', COUNT(*)::bigint
    FROM "CompanyReport" child
    LEFT JOIN "Company" company ON child."companyId" = company."id"
    WHERE company."id" IS NULL
    UNION ALL
    SELECT 'company_identifiers', COUNT(*)::bigint
    FROM "company_identifiers" child
    LEFT JOIN "Company" company ON child."companyId" = company."id"
    WHERE company."id" IS NULL
  `

  const [{ count: companyCount }] = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`SELECT COUNT(*)::bigint AS count FROM "Company"`

  const [{ count: wikidataIdentifierCount }] = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count
    FROM "company_identifiers"
    WHERE type = 'WIKIDATA'
  `

  const wikidataMismatches = await prisma.$queryRaw<
    Array<{ wikidataId: string | null; identifierValue: string | null }>
  >`
    SELECT c."wikidataId", i.value AS "identifierValue"
    FROM "Company" c
    LEFT JOIN "company_identifiers" i
      ON i."companyId" = c.id AND i.type = 'WIKIDATA'
    WHERE c."wikidataId" IS NOT NULL
      AND (i.value IS NULL OR i.value <> c."wikidataId")
  `

  console.log('Company PK flip validation')
  console.log('------------------------')
  console.log(`Companies: ${companyCount}`)
  console.log(`WIKIDATA identifiers: ${wikidataIdentifierCount}`)
  console.log('Orphan FK rows (expect 0):')
  for (const row of orphanChecks) {
    console.log(`  ${row.table}: ${row.count}`)
  }

  if (wikidataMismatches.length > 0) {
    console.log('Wikidata column vs identifier mismatches:')
    for (const row of wikidataMismatches) {
      console.log(`  ${row.wikidataId} vs ${row.identifierValue}`)
    }
  } else {
    console.log('Wikidata column matches WIKIDATA identifiers')
  }

  const orphanTotal = orphanChecks.reduce(
    (sum, row) => sum + Number(row.count),
    0
  )
  if (orphanTotal > 0 || wikidataMismatches.length > 0) {
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
