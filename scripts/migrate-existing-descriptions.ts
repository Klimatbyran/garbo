import fetch from 'node-fetch'
import apiConfig from '../src/config/api.ts'
import { askPrompt } from '../src/lib/openai'

// baseURL and prod_base_url may be interchanged based on where you want to get and post
const { secret } = apiConfig // Change the API_SECRET in your .env file depending on which environment you want to access
const env = 'prod' // Change depending on which environment you want to migrate in
const URL = env === 'prod' ? process.env.API_BASE_URL_PROD : (env === 'staging' ? process.env.API_BASE_URL_STAGING : process.env.API_BASE_URL_DEV)

async function updateDescriptions() {
    
    // Get a valid authentication token
    const responseAuth = await fetch(`${URL}/auth/token`, {
        method: `POST`,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: 'garbo',
            client_secret: secret
        })
    })
    if(!responseAuth.ok) {
        console.error('ERROR: Failed to authenticate.', `${await responseAuth.text()}`)
    }

    const { token } = await responseAuth.json()

    // Get the companies' descriptions
    console.log("Fetching companies' descriptions...")
    const response = await fetch(`${URL}/companies`, {
        method: 'GET',
    })

    // Post the descriptions
    if(response.ok) {
        console.log(`Posting descriptions...`)
        const companies: Array<{ name: string, wikidataId: string, description: string }> = await response.json()
        for(let i = 0; i < companies.length; i++) {
            const elem = companies[i]
            if(elem.description) {
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
                    await fetch(`${URL}/companies/${elem.wikidataId}`, {
                        method: `POST`,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            descriptions: [
                                {
                                    language: 'SV',
                                    text: descriptionSV
                                },
                                {
                                    language: 'EN',
                                    text: descriptionEN
                                }
                            ],
                            name: elem.name,
                            wikidataId: elem.wikidataId,
                        })
                    })
                } catch(err) {
                    console.log(`Could not update descriptions: ${err.text}`)
                }
            }
        }
    }
    else {
        console.error(`Failed to get the companies' ${response.text()}`)
    }
}


async function main() {
    await updateDescriptions()
    console.log('Finished migrating descriptions.')
}

main()