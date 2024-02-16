import dotenv from 'dotenv'
dotenv.config() // keep this line first in file

import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'

import discord from './discord'

// keep this line, otherwise the workers won't be started
import * as workers from './workers'
import {
  discordReview,
  downloadPDF,
  indexParagraphs,
  parseText,
  reflectOnAnswer,
  searchVectors,
  splitText,
} from './queues'
import { scope2Image } from './lib/imageCreator'

// add dummy job
// downloadPDF.add('dummy', {
//   url: 'https://mb.cision.com/Main/17348/3740648/1941181.pdf',
// })

/*
downloadPDF.add('volvo', {
  url: 'https://www.volvogroup.com/content/dam/volvo-group/markets/master/investors/reports-and-presentations/annual-reports/AB-Volvo-Annual-Report-2022.pdf',
})*/

// start workers
Object.values(workers).forEach((worker) => worker.run())

// start ui
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(downloadPDF),
    new BullMQAdapter(splitText),
    new BullMQAdapter(indexParagraphs),
    new BullMQAdapter(searchVectors),
    new BullMQAdapter(parseText),
    new BullMQAdapter(reflectOnAnswer),
    new BullMQAdapter(discordReview),
  ],
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Klimatkollen',
    },
  },
})

const app = express()
discord.login()

app.use('/admin/queues', serverAdapter.getRouter())
app.listen(3000, () => {
  console.log('Running on 3000...')
  console.log('For the UI, open http://localhost:3000/admin/queues')
})

app.get('/', (req, res) => {
  res.send(`Hi I'm Garbo!`)
})

app.get(`/api/companies`, async function (req, res) {
  res.writeHead(200, { 'Content-Type': 'image/png' })
  const image = await scope2Image({
    companyName: 'Volvo',
    bransch: 'Manufacturing',
    baseYear: '2019',
    url: 'https://example.com',
    emissions: [
      {
        year: 2019,
        scope1: {
          emissions: '1234',
          unit: 'Mt CO2e',
          baseYear: '2019',
        },
        scope2: {
          emissions: '1235',
          unit: 'Mt CO2e',
          mb: '1235',
          lb: '125',
          baseYear: '2019',
        },
        scope3: {
          emissions: '5322000',
          unit: 'x1000 ton CO2e',
          baseYear: '2019',
          categories: {
            '1_purchasedGoods': '100000000',
            '2_capitalGoods': '100000000',
            '3_fuelAndEnergyRelatedActivities': '100000000',
            '4_upstreamTransportationAndDistribution': '100000000',
            '5_wasteGeneratedInOperations': '100000000',
            '6_businessTravel': '100000000',
            '7_employeeCommuting': '100000000',
            '8_upstreamLeasedAssets': '100000000',
            '9_downstreamTransportationAndDistribution': '100000000',
            '10_processingOfSoldProducts': '100000000',
            '11_useOfSoldProducts': '100000000',
            '12_endOfLifeTreatmentOfSoldProducts': '100000000',
            '13_downstreamLeasedAssets': '100000000',
            '14_franchises': '100000000',
            '15_investments': '100000000',
            '16_other': '100000000',
          },
        },
      },
      {
        year: 2020,
        scope1: {
          emissions: '1234',
          unit: 'Mt CO2e',
          baseYear: '2019',
        },
        scope2: {
          emissions: '1235',
          unit: 'Mt CO2e',
          mb: '1235',
          lb: '125',
          baseYear: '2019',
        },
        scope3: {
          emissions: '5322000',
          unit: 'x1000 ton CO2e',
          baseYear: '2019',
          categories: {
            '1_purchasedGoods': '100000000',
            '2_capitalGoods': '100000000',
            '3_fuelAndEnergyRelatedActivities': '100000000',
            '4_upstreamTransportationAndDistribution': '100000000',
            '5_wasteGeneratedInOperations': '100000000',
            '6_businessTravel': '100000000',
            '7_employeeCommuting': '100000000',
            '8_upstreamLeasedAssets': '100000000',
            '9_downstreamTransportationAndDistribution': '100000000',
            '10_processingOfSoldProducts': '100000000',
            '11_useOfSoldProducts': '100000000',
            '12_endOfLifeTreatmentOfSoldProducts': '100000000',
            '13_downstreamLeasedAssets': '100000000',
            '14_franchises': '100000000',
            '15_investments': '100000000',
            '16_other': '100000000',
          },
        },
      },
      {
        year: 2021,
        scope1: {
          emissions: '1234',
          unit: 'Mt CO2e',
          baseYear: '2019',
        },
        scope2: {
          emissions: '1235',
          unit: 'Mt CO2e',
          mb: '1235',
          lb: '125',
          baseYear: '2019',
        },
        scope3: {
          emissions: '5322000',
          unit: 'x1000 ton CO2e',
          baseYear: '2019',
          categories: {
            '1_purchasedGoods': '100000000',
            '2_capitalGoods': '100000000',
            '3_fuelAndEnergyRelatedActivities': '100000000',
            '4_upstreamTransportationAndDistribution': '100000000',
            '5_wasteGeneratedInOperations': '100000000',
            '6_businessTravel': '100000000',
            '7_employeeCommuting': '100000000',
            '8_upstreamLeasedAssets': '100000000',
            '9_downstreamTransportationAndDistribution': '100000000',
            '10_processingOfSoldProducts': '100000000',
            '11_useOfSoldProducts': '100000000',
            '12_endOfLifeTreatmentOfSoldProducts': '100000000',
            '13_downstreamLeasedAssets': '100000000',
            '14_franchises': '100000000',
            '15_investments': '100000000',
            '16_other': '100000000',
          },
        },
      },
    ],
  })
  res.end(image, 'binary')
})
