import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { searchCompany } from '../lib/wikidata'
import { ask, askPrompt } from '../openai'
import { findFacit } from '../lib/facit'

class JobData extends Job {
  declare data: {
    url: string
    companyName: string
    previousAnswer: string
    answer: string
    threadId: string
    previousError: string
  }
}
const transformData = (data: any): any => {
  return Object.entries(data)
    .map(([key, wikidata]: [string, any]) => {
      if (!wikidata || !wikidata.claims) return null

      const verifiedUrl = `https://www.wikidata.org/wiki/${wikidata.id}`

      const emissionsData = (wikidata.claims.P5991 || []).map(
        (emission: any) => {
          const year = emission.qualifiers.P580[0].datavalue.value.time.slice(
            1,
            5
          )
          const scope1Emission = emission.qualifiers.P3831
            ? parseFloat(emission.qualifiers.P3831[0].datavalue.value.amount)
            : null
          const scope2Emission = emission.qualifiers.P580
            ? parseFloat(emission.qualifiers.P580[0].datavalue.value.amount)
            : null
          const scope3Emission = emission.qualifiers.P582
            ? parseFloat(emission.qualifiers.P582[0].datavalue.value.amount)
            : null

          return {
            year: year,
            reference: emission.references[0].snaks.P854[0].datavalue.value,
            scope1: {
              emissions: scope1Emission,
              verified: verifiedUrl,
              unit: 'tCO2e',
            },
            scope2: {
              emissions: scope2Emission,
              verified: verifiedUrl,
              unit: 'tCO2e',
            },
            scope3: {
              emissions: scope3Emission,
              verified: verifiedUrl,
              unit: 'tCO2e',
              categories: {
                //TODO: add scope 3 categories
                '1_purchasedGoods': null,
                '2_capitalGoods': null,
                '3_fuelAndEnergyRelatedActivities': null,
                '4_upstreamTransportationAndDistribution': null,
                '5_wasteGeneratedInOperations': null,
                '6_businessTravel': null,
                '7_employeeCommuting': null,
                '8_upstreamLeasedAssets': null,
                '9_downstreamTransportationAndDistribution': null,
                '10_processingOfSoldProducts': null,
                '11_useOfSoldProducts': null,
                '12_endOfLifeTreatmentOfSoldProducts': null,
                '13_downstreamLeasedAssets': null,
                '14_franchises': null,
                '15_investments': null,
                '16_other': null,
              },
            },
          }
        }
      )

      return {
        node: wikidata.id,
        url: `https://www.wikidata.org/wiki/${wikidata.id}`,
        logo: wikidata.claims.P18
          ? `https://commons.wikimedia.org/wiki/File:${wikidata.claims.P18[0].mainsnak.datavalue.value}`
          : null,
        label: wikidata.labels ? wikidata.labels.en.value : key,
        description:
          wikidata.descriptions && wikidata.descriptions.en
            ? wikidata.descriptions.en.value
            : null,
        emissions: emissionsData,
      }
    })
    .filter((item) => item !== null)
}

const worker = new Worker(
  'includeFacit',
  async (job: JobData) => {
    const facit = await findFacit(job.data.url || job.data.companyName)
    job.log('Found facit: ' + JSON.stringify(facit, null, 2))

    if (!facit) {
      return JSON.stringify({ facit: { error: 'No facit found' } }, null, 2)
    }

    return JSON.stringify({ facit: facit }, null, 2)
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
