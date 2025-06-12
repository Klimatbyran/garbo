import { PrismaClient } from '@prisma/client'
import wikidataConfig from '../src/config/wikidata'
import {
  bulkCreateOrEditCarbonFootprintClaim,
  Claim,
  diffTotalCarbonFootprintClaims,
  editEntity,
  getClaims,
  reduceToMostRecentClaims,
  transformEmissionsToClaims,
} from '../src/lib/wikidata'
import { exit } from 'process'
import { ReportingPeriod } from '../src/lib/emissions'

function removeMillisecondsFromISO(dateTime) {
  try {
    // Check if input is a valid ISO string
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid ISO DateTime string')
    }

    // Convert to ISO string and remove the milliseconds part
    return date.toISOString().split('.')[0] + 'Z'
  } catch (error) {
    console.error('Error:', error.message)
    return ''
  }
}

//Currently still in testing the filters filter out only data related to ABB as this company is present in the Sandbox
async function pushWikidata() {
  const entityDownloadId: `Q${number}` = 'Q731938'
  const entityUploadId: `Q${number}` = 'Q238689'
  const envBaseURL: string = 'https://api.klimatkollen.se/api'

  const companyRes = await fetch(`${envBaseURL}/companies`)

  if (!companyRes.ok) {
    console.error('Could not fetch companies')
    exit(0)
  }

  const companies: any[] = await companyRes.json()
  for (const company of companies) {
    const reportingPeriods: ReportingPeriod[] = company.reportingPeriods
    let claims: Claim[] = []
    for (const reportingPeriod of reportingPeriods) {
      if (reportingPeriod.emissions && reportingPeriod.reportURL) {
        claims.push(
          ...transformEmissionsToClaims(
            reportingPeriod.emissions,
            removeMillisecondsFromISO(reportingPeriod.startDate),
            removeMillisecondsFromISO(reportingPeriod.endDate),
            reportingPeriod.reportURL ?? ''
          )
        )
      }
    }
    claims = reduceToMostRecentClaims(claims);
    if (claims.length > 0) {
      bulkCreateOrEditCarbonFootprintClaim(
        company.wikidataId as `Q${number}`,
        claims
      )
      console.log(`Updated ${company.wikidataId}`);
    }
  }
}

pushWikidata()
