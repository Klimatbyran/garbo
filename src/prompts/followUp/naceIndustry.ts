import { z } from 'zod'

export const schema = z.object({
  nace: z.object({
    code: z.string(),
    description: z.string()
  })
})

export const prompt = `
Extract the company's primary NACE code (Nomenclature of Economic Activities) based on their main business activity.

Consider:
1. The company's main revenue source
2. Their primary business operations
3. The industry they operate in
4. Their products and services

Return the most specific NACE code that applies. Format as a 4-digit code with dot, e.g. "35.11".

Common NACE codes:

Manufacturing:
10.71 Manufacture of bread
20.13 Manufacture of other inorganic basic chemicals
24.10 Manufacture of basic iron and steel
27.11 Manufacture of electric motors, generators and transformers

Energy:
35.11 Production of electricity
35.12 Transmission of electricity
35.13 Distribution of electricity
35.14 Trade of electricity
35.21 Manufacture of gas
35.22 Distribution of gaseous fuels through mains
35.23 Trade of gas through mains

Construction:
41.10 Development of building projects
41.20 Construction of residential and non-residential buildings
42.11 Construction of roads and motorways
42.91 Construction of water projects

Transport:
49.10 Passenger rail transport, interurban
49.20 Freight rail transport
49.31 Urban and suburban passenger land transport
49.41 Freight transport by road
50.20 Sea and coastal freight water transport
51.10 Passenger air transport
51.21 Freight air transport

Financial Services:
64.19 Other monetary intermediation
64.30 Trusts, funds and similar financial entities
64.91 Financial leasing
65.11 Life insurance
65.12 Non-life insurance
66.12 Security and commodity contracts brokerage

Real Estate:
68.10 Buying and selling of own real estate
68.20 Renting and operating of own or leased real estate
68.31 Real estate agencies
68.32 Management of real estate on a fee or contract basis

Return in JSON format:
{
  "nace": {
    "code": "35.11",
    "description": "Production of electricity"
  }
}`

const queryTexts = [
  'Company business description',
  'Main business activity',
  'Primary operations',
  'Revenue sources',
  'Industry classification'
]

export default { prompt, schema, queryTexts }
