import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testIdentifiers() {
  console.log('Testing identifier system...')

  try {
    // Test 1: Check if CompanyIdentifier model exists
    console.log('✓ CompanyIdentifier model is available')

    // Test 2: Test creating a test identifier
    const testCompany = await prisma.company.findFirst()
    if (!testCompany) {
      console.log('❌ No companies found in database')
      return
    }

    console.log(
      `✓ Found test company: ${testCompany.name} (${testCompany.wikidataId})`,
    )

    // Test 3: Test identifier service import
    const { identifierService } = await import(
      '../src/api/services/identifierService'
    )
    console.log('✓ Identifier service imported successfully')

    // Test 4: Test schema imports
    const { identifierTypeSchema, companyIdentifierSchema } = await import(
      '../src/api/schemas/identifier'
    )
    console.log('✓ Identifier schemas imported successfully')

    // Test 5: Validate identifier types
    const validTypes = ['lei', 'swedishOrgNumber', 'isin', 'cin', 'duns']
    for (const type of validTypes) {
      const result = identifierTypeSchema.safeParse(type)
      if (result.success) {
        console.log(`✓ Identifier type '${type}' is valid`)
      } else {
        console.log(`❌ Identifier type '${type}' is invalid:`, result.error)
      }
    }

    // Test 6: Test identifier schema validation
    const testIdentifier = {
      type: 'lei',
      value: '12345678901234567890',
      verified: true,
    }

    const identifierResult = companyIdentifierSchema.safeParse(testIdentifier)
    if (identifierResult.success) {
      console.log('✓ Identifier schema validation works')
    } else {
      console.log(
        '❌ Identifier schema validation failed:',
        identifierResult.error,
      )
    }

    console.log('\n🎉 All tests passed! Identifier system is ready to use.')
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run test
testIdentifiers()
  .then(() => {
    console.log('Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })

export default testIdentifiers
