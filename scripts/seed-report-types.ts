/**
 * Seed only report types.
 * Usage:
 *   npm run seed:report-types
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const REPORT_TYPES = [
  { slug: 'sustainability-report', label: 'Sustainability report' },
  { slug: 'annual-report', label: 'Annual report' },
  { slug: 'integrated-report', label: 'Integrated report' },
  { slug: 'csr-report', label: 'CSR report' },
  { slug: 'climate-report', label: 'Climate report' },
  { slug: 'esg-report', label: 'ESG report' },
  {
    slug: 'tcfd',
    label: 'TCFD (Task Force on Climate-related Financial Disclosures)',
  },
  {
    slug: 'corporate-responsibility-report',
    label: 'Corporate responsibility report',
  },
  { slug: 'modern-slavery-statement', label: 'Modern slavery statement' },
  { slug: 'other', label: 'Other' },
] as const

async function main() {
  for (const option of REPORT_TYPES) {
    await prisma.reportType.upsert({
      where: { slug: option.slug },
      create: option,
      update: { label: option.label },
    })
  }
  console.log(`Seeded ${REPORT_TYPES.length} report types.`)
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
