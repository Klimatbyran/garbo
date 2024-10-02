import { z } from 'zod'

export const schema = z.object({
  factors: z.array(
    z.object({
      description: z.string(),
      value: z.number(),
      unit: z.string(),
    })
  ),
})

export const prompt = `
Extract the key emission factors for others to multiply when calculating their scope 3 downstream emissions when using your products or services. For example- a travel company might use co2e per km for a car.

Be as accurate as possible when extracting factors and only include ones mentioned in the text. These values will be used to automatically calculate the emissions for products in an automated form where the user enter amount of km and we will return the emissions.

Example:
\`\`\`json
{ 
  "factors": [{ "description": "CO2e per km for car", "value": 0.2, "unit": "kgCO2e/km"}]
}
\`\`\`
`

export default { prompt, schema }
