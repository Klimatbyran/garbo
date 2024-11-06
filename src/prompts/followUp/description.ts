import { z } from 'zod'

export const schema = z.object({
  description: z.string(),
})

export const prompt = `
** Description **
Beskrivning av företaget. Tänk på att vara så informativ som möjligt. Den här texten ska visas på en sida
för hållbarhetsredovisning så det är viktigt att den är informativ och beskriver företaget väl men inte tillåter
texter som kan uppfattas som greenwashing eller marknadsföring. Många företag är okända för allmänheten så det
är viktigt att beskrivningen är informativ och beskriver företaget väl.

*** LANGUAGE: ONLY WRITE THE DESCRIPTION IN SWEDISH! If the original texts are written in English, translate to Swedish ***

Example, follow the format below. Do not use markdown in the output:
{
  "description": "En beskrivning av företaget.",
}
`

export default { prompt, schema }
