import nodeHtmlToImage from 'node-html-to-image'

/*

This is an example of the structure of the JSON object that will be sent to the imageCreator function.
{
      "companyName": "Example Company",
      "bransch": "Manufacturing",
      "baseYear": "2019",
      "url": "https://example.com",
       "2019": {
          "scope1": {
            "emissions": "1234",
            "unit": "Mt CO2e",
            "baseYear": "2019"
          },
          "scope2": {
            "emissions": "1235",
            "unit": "Mt CO2e",
            "mb": "1235",
            "lb": "125",
            "baseYear": "2019"
          },
          "scope3": {
            "emissions": "5322000",
            "unit": "x1000 ton CO2e",
            "baseYear": "2019",
            "categories": {
              "1_purchasedGoods": "100000000",
              "2_capitalGoods": "100000000",
              "3_fuelAndEnergyRelatedActivities": "100000000",
              "4_upstreamTransportationAndDistribution": "100000000",
              "5_wasteGeneratedInOperations": "100000000",
              "6_businessTravel": "100000000",
              "7_employeeCommuting": "100000000",
              "8_upstreamLeasedAssets": "100000000",
              "9_downstreamTransportationAndDistribution": "100000000",
              "10_processingOfSoldProducts": "100000000",
              "11_useOfSoldProducts": "100000000",
              "12_endOfLifeTreatmentOfSoldProducts": "100000000",
              "13_downstreamLeasedAssets": "100000000",
              "14_franchises": "100000000",
              "15_investments": "100000000",
              "16_other": "100000000"
            }
          },
          "totalEmissions": "1553",
          "totalUnit": "Million ton CO2e",
        },
      "reliability": "High",
      "needsReview": true,
      "reviewComment": "The company has reported emissions in tons instead of metric tons. This is not a common unit and should be converted to metric tons."
      "reviewStatusCode": "412"
    }
  */

type YearEmissions = {
  year: number
  scope1: {
    emissions: string
    unit: string
    baseYear: string
  }
  scope2: {
    emissions: string
    unit: string
    mb: string
    lb: string
    baseYear: string
  }
  scope3: {
    emissions: string
    unit: string
    baseYear: string
    categories: {
      [key: string]: string
    }
  }
  totalEmissions?: string
  totalUnit?: string
}

type CompanyData = {
  companyName: string
  bransch?: string
  baseYear?: string
  url?: string
  emissions: Array<YearEmissions>
  reliability?: string
  needsReview?: boolean
  reviewComment?: string
  reviewStatusCode?: string
}

const head = () => `
  <head>
    <style>
      body {
        font-family: arial, sans-serif;
        padding: 10px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      td, th {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }
      tr:nth-child(even) {
        background-color: #dddddd;
      }
    </style>
  </head>
`

/*
Koldioxidutsläpp (CO 2 e)
Utsläpp inom scope 1, 2 och 3 (CO 2 e) och biogena utsläpp (utanför scope) genererade av Skanskas verksamhet.

Ton CO 2 e	2022	2021	2020	2019	2015
Scope 1	164 000	194 000	193 000	213 000	322 000
Scope 2 3	36 000	35 000	38 000	43 000	43 000
Platsbaserat tillvägagångssätt	18 000	22 000	72 000	78 000	80 000
Marknadsbaserat tillvägagångssätt	—	—	—	—	—
Förändring jämfört med basår (scope 1 och 2), %	-55	-46	-34	-28	—
Koldioxidintensitet 4	1,13	1,46	1,67	1,64	2,60
*/

export const scope2Image = async (company: CompanyData) => {
  const rowHeader = (emissions) => `
  <tr>
    <th>
      Ton CO<sub>2</sub>e
    </th>
    ${emissions.map((year) => `<th>${year.year}</th>`).join('\n')}
  </tr>
  `

  const emissions = company.emissions.sort((a, b) => a.year - b.year)
  const image = await nodeHtmlToImage({
    html: `
      <html>
       ${head()}
        <body>
            <h1>Koldioxidutsläpp (CO<sub>2</sub>e)</h1>
            Utsläpp inom scope 1, 2 och 3 (CO<sub>2</sub>e) genererade av ${
              company.companyName
            } verksamhet.

          <table>
           ${rowHeader(emissions)}
           <tr>
            <td>Scope 1</td>
            ${emissions
              .map((year) => `<td>${year.scope1.emissions}</td>`)
              .join('\n')}
          </tr>
           <tr>
            <td>Scope 2</td>
            ${emissions
              .map((year) => `<td>${year.scope2.emissions}</td>`)
              .join('\n')}
          </tr>
           <tr>
            <td>Scope 3</td>
            ${emissions
              .map((year) => `<td>${year.scope3.emissions}</td>`)
              .join('\n')}
          </tr>
          </table>
        </body>
      </html>`,
  })
  return image
}
