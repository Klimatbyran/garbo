import fetch from 'node-fetch'
import apiConfig from '../src/config/api.ts'
import { askPrompt } from '../src/lib/openai'

// baseURL and prod_base_url may be interchanged based on where you want to get and post
const { baseURL, prod_base_url, secret } = apiConfig

async function updateDescriptions() {
  // Get a valid authentication token
  const responseAuth = await fetch(`${prod_base_url}/auth/token`, {
    method: `POST`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: 'garbo',
      client_secret: secret,
    }),
  })
  if (!responseAuth.ok) {
    console.error('Failed to authenticate.')
    throw `Error: ${responseAuth.text}`
  }

  const { token } = await responseAuth.json()

  // Get the companies' descriptions
  console.log("Fetching companies' descriptions...")
  const response = await fetch(`${prod_base_url}/companies`, {
    method: 'GET',
  })

  // Post the descriptions
  if (response.ok) {
    console.log(`Posting descriptions...`)
    const companies: Array<{
      name: string
      wikidataId: string
      description: string
    }> = await response.json()
    for (let i = 0; i < companies.length; i++) {
      const elem = companies[i]
      if (elem.description) {
        const descriptionSV = await askPrompt(
          `Du är en torr revisor som ska skriva en kort, objektiv beskrivning av företagets verksamhet, baserat på en redan existerande beskrivning.
  
                    ** Beskrivning **
                    Följ dessa riktlinjer:
                    
                    1. Längd: Beskrivningen får inte överstiga 300 tecken, inklusive mellanslag.
                    2. Syfte: Endast företagets verksamhet ska beskrivas. Använd ett extra sakligt och neutralt språk.
                    3. Förbjudet innehåll (marknadsföring): VIKTIGT! Undvik ord som "ledande", "i framkant", "marknadsledare", "innovativt", "värdefull", "framgångsrik" eller liknande. Texten får INTE innehålla formuleringar som uppfattas som marknadsföring eller säljande språk.
                    4. Förbjudet innehåll (hållbarhet): VIKTIGT! Undvik ord som "hållbarhet", "klimat" eller liknande. Texten får INTE innehålla bedömningar av företagets hållbarhetsarbete.
                    5. Språk: VIKTIGT! Beskrivningen ska ENDAST vara på svenska. Om originaltexten är på engelska, översätt till svenska.
                    
                    För att säkerställa att svaret följer riktlinjerna, tänk på att:
                    
                    - Använd ett sakligt och neutralt språk.
                    - Aldrig använda marknadsförande eller värderande språk.
                    - Tydligt beskriva företagets verksamhet.
                    
                    Svara endast med företagets beskrivning. Lägg inte till andra instruktioner eller kommentarer.
                    
                    Exempel på svar: "AAK är ett företag som specialiserar sig på växtbaserade oljelösningar. Företaget erbjuder ett brett utbud av produkter och tjänster inom livsmedelsindustrin, inklusive specialfetter för choklad och konfektyr, mejeriprodukter, bageri och andra livsmedelsapplikationer."
                    
                    Följande är den nuvarande beskrivningen:`,
          elem.description
        )
        const descriptionEN = await askPrompt(
          `Översätt följande text till engelska.`,
          descriptionSV
        )
        try {
          const response = await fetch(
            `${prod_base_url}/companies/${elem.wikidataId}`,
            {
              method: 'GET',
            }
          )
          if (response.ok) {
            await fetch(`${baseURL}/companies/${elem.wikidataId}`, {
              method: `POST`,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                descriptions: [
                  {
                    language: 'SV',
                    text: descriptionSV,
                  },
                  {
                    language: 'EN',
                    text: descriptionEN,
                  },
                ],
                name: elem.name,
                wikidataId: elem.wikidataId,
              }),
            })
          }
        } catch (err) {
          console.log(`Could not update descriptions: ${err.text}`)
        }
      }
    }
  } else {
    console.error(`Failed to get the companies' ${response.text()}`)
  }
}

async function main() {
  await updateDescriptions()
  console.log('Finished migrating descriptions.')
}

main()
