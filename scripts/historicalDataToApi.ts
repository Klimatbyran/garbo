import 'dotenv/config'
import fetch from 'node-fetch'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import apiConfig from '../src/config/api'

const { baseURL, tokens } = apiConfig
const USERS = {
  garbo: {
    email: 'hej@klimatkollen.se',
    token: tokens[0],
  },
  alex: {
    email: 'alex@klimatkollen.se',
    token: tokens[1],
  },
}

async function postJSON(url, body, user = 'alex') {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${USERS[user].token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(res.status, res.statusText, url, text)
  }
}

async function main() {
  const data = JSON.parse(
    await readFile(resolve('output/companies.json'), 'utf-8')
  )
  for (const company of data) {
    const {
      wikidataId,
      name,
      tags,
      internalComment,
      reportingPeriods,
      description,
      goals,
      initiatives,
    } = company
    await postJSON(
      `${baseURL}/companies`,
      {
        wikidataId,
        name,
        description,
        tags,
        internalComment,
        metadata: { comment: 'Import verified data from spreadsheet' },
      },
      'alex'
    )
    for (const rp of reportingPeriods) {
      if (rp.emissions) {
        await postJSON(
          `${baseURL}/companies/${wikidataId}/${new Date(
            rp.endDate
          ).getFullYear()}/emissions`,
          {
            startDate: rp.startDate,
            endDate: rp.endDate,
            reportURL: rp.reportURL,
            emissions: rp.emissions,
            metadata: {
              comment: 'Import verified data from spreadsheet',
              source: rp.reportURL,
            },
          },
          'alex'
        )
      }
      if (rp.economy) {
        await postJSON(
          `${baseURL}/companies/${wikidataId}/${new Date(
            rp.endDate
          ).getFullYear()}/economy`,
          {
            startDate: rp.startDate,
            endDate: rp.endDate,
            reportURL: rp.reportURL,
            economy: rp.economy,
            metadata: {
              comment: 'Import verified data from spreadsheet',
              source: rp.reportURL,
            },
          },
          'alex'
        )
      }
    }
    if (goals && goals.length) {
      await postJSON(
        `${baseURL}/companies/${wikidataId}/goals`,
        {
          goals,
          metadata: { comment: 'Import verified data from spreadsheet' },
        },
        'garbo'
      )
    }
    if (initiatives && initiatives.length) {
      await postJSON(
        `${baseURL}/companies/${wikidataId}/initiatives`,
        {
          initiatives,
          metadata: { comment: 'Import verified data from spreadsheet' },
        },
        'garbo'
      )
    }
  }
}

await main()
