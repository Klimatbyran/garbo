import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateLeiToIdentifiers() {
  console.log('Starting LEI to identifiers migration...')

  try {
    // Get all companies with LEI data
    const companies = await prisma.company.findMany({
      where: {
        AND: [{ lei: { not: null } }, { lei: { not: '' } }],
      },
      select: {
        wikidataId: true,
        lei: true,
      },
    })

    console.log(`Found ${companies.length} companies with LEI data`)

    // Create a system user for migration metadata
    let systemUser = await prisma.user.findFirst({
      where: { name: 'system-migration' },
    })

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          name: 'system-migration',
          email: 'system@garbo.ai',
        },
      })
      console.log('Created system user for migration')
    }

    let migratedCount = 0
    let skippedCount = 0

    for (const company of companies) {
      if (!company.lei) {
        skippedCount++
        continue
      }

      try {
        // Check if identifier already exists
        const existingIdentifier = await prisma.companyIdentifier.findUnique({
          where: {
            companyId_type: {
              companyId: company.wikidataId,
              type: 'lei',
            },
          },
        })

        if (existingIdentifier) {
          console.log(
            `LEI identifier already exists for ${company.wikidataId}, skipping`,
          )
          skippedCount++
          continue
        }

        // Create metadata for the migration
        const metadata = await prisma.metadata.create({
          data: {
            comment: 'Migrated from legacy LEI field',
            source: 'system-migration',
            userId: systemUser.id,
            verifiedByUserId: systemUser.id, // Mark as verified since it was already in the system
          },
        })

        // Create identifier record
        await prisma.companyIdentifier.create({
          data: {
            companyId: company.wikidataId,
            type: 'lei',
            value: company.lei,
            metadataId: metadata.id,
          },
        })

        migratedCount++
        console.log(`Migrated LEI for ${company.wikidataId}: ${company.lei}`)
      } catch (error) {
        console.error(`Error migrating LEI for ${company.wikidataId}:`, error)
      }
    }

    console.log(`Migration completed:`)
    console.log(`- Migrated: ${migratedCount}`)
    console.log(`- Skipped: ${skippedCount}`)
    console.log(`- Total processed: ${companies.length}`)
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateLeiToIdentifiers()
    .then(() => {
      console.log('Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export default migrateLeiToIdentifiers
