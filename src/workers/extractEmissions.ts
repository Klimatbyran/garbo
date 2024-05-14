import { Worker, Job, FlowProducer } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import prompt from '../prompts/parsePDF'
import extractJson from '../prompts/extractJson'
import config from '../config/openai'
import discord from '../discord'

const openai = new OpenAI(config)

class JobData extends Job {
  data: {
    url: string
    paragraphs: string[]
    threadId: string
    pdfHash: string
  }
}

const flow = new FlowProducer({ connection: redis })

const worker = new Worker(
  'extractEmissions',
  async (job: JobData, token: string) => {
    const pdfParagraphs = job.data.paragraphs
    job.log(`Asking AI for following context and prompt: ${pdfParagraphs.join(
      '\n\n'
    )}
    ${prompt}`)

    const message = await discord.sendMessage(
      job.data,
      `🤖 Hämtar utsläppsdata...`
    )

    const stream = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert in CSRD reporting. Be consise and accurate.',
        },
        { role: 'user', content: prompt },
        { role: 'assistant', content: 'Sure! Just send me the PDF data?' },
        { role: 'user', content: pdfParagraphs.join('\n\n') },
      ],
      model: 'gpt-4-turbo',
      stream: true,
    })
    let response = ''
    let progress = 0
    for await (const part of stream) {
      response += part.choices[0]?.delta?.content || ''
      job.updateProgress(Math.min(1, progress / 400))
    }

    job.log(response)

    message.edit('✅ Utsläppsdata hämtad')
    const markdown = response
      .match(/```markdown(.|\n)*```/)?.[0]
      .replace('```markdown', '```')
    discord.sendMessage(job.data, markdown.slice(0, 2000))

    const data = {
      threadId: job.data.threadId,
      url: job.data.url,
      answer: response,
    }

    await flow.add({
      name: 'reflections',
      queueName: 'reflectOnAnswer',
      data: { ...job.data, answer: response },
      children: [
        {
          name: 'companyName',
          data: {
            ...data,
            prompt:
              'Extract the company name. Just reply with the information you can find in json format: \n\n```json\n{\n "companyName": "Company X", "website": "https://example.com", "orgNr": "1234567"\n}\n```',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'industry',
          data: {
            ...data,
            prompt:
              'Extract industry, sector, industry group, according to GICS. Just reply with the information in json format: \n\n```json\n{\n "industry": "Industry X"\n}\n```',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'scope1+2',
          data: {
            ...data,
            prompt:
              'Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude latest year. Include market based and location based. Add it as field emissions: Example:  \n\n```json\n{emissions: [{year: 2021, "unit": "tCO2e", "scope1": {}, "scope2": {}}, {year: 2022, ...}, {year: 2023, ...}]}\n```\n in the JSON.',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'scope3',
          data: {
            ...data,
            prompt:
              'Extract scope 3 emissions according to the GHG protocol. Add it as field emissions. Include all years you can find and never exclude latest year. Example: \n\n```json\n{emissions: [{year: 2021, "scope3": { categories: {}}}, {year: 2022, ...}, {year: 2023, ...}]}\n```\n in the JSON. Include as many categories as you can find and their scope 3 emissions.',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'goals',
          data: {
            ...data,
            prompt:
              "Extract the company goals for reducing their carbon emissions Add it as field goals: Example:  \n\n```json\n{goals: [{description: 'Net zero before xxx.', year: xxx, reductionPercent: 100]}\n```\n in the JSON. Be as accurate as possible when extracting goals. These values will be plotted in a graph later on.",
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'sustainability initiatives',
          data: {
            ...data,
            prompt:
              'Extract the company sustainability initiatives. Add it as field initiatives: Example:  \n\n```json\n{iniatives: [{description: "We plan to switch to train for all business trips.", year: 2025, reductionPercent: 30, scope: "scope3.6_businessTravel", comment: "We expect this measure to reduce CO2 emissions in scope 3 business travel"}]}\n```\n in the JSON. Be as accurate as possible when extracting initiatives. These values will be plotted as dots on a graph later on.',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'sustainability contacts',
          data: {
            ...data,
            prompt:
              'Extract the company sustainability contacts. Add it as field contacts: Example:  \n\n```json\n{contacts: [{name: "John Doe", role: "Sustainability Manager", email: "john@doe.se", phone: "123456789"}]}\n```\n in the JSON. Be as accurate as possible when extracting contacts. These values will be used to contact the company with the extract later on for manual approval.',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'turnover',
          data: {
            ...data,
            prompt:
              'Extract the company turnover. Add it as field turnover: Example:  \n\n```json\n{turnover: [{year: 2021, value: 1000000, currency: "SEK"}]}\n```\n in the JSON. Be as accurate as possible when extracting turnover. These values will be used to calculate the emissions intensity of the company.',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'key upstream emission factors',
          data: {
            ...data,
            prompt:
              'Extract the key factors for others to multiply when calculating their scope 3 downstream emissions when using your products or services. For example- a travel company might use co2e per km for a car. Add it as field factors: Example:  \n\n```json\n{"factors": [{"description": "CO2e per km for car", "value": 0.2, "unit": "kgCO2e/km"}]}\n```\n in the JSON. Be as accurate as possible when extracting factors and only include ones mentioned in the text.',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'publicComment',
          data: {
            ...data,
            prompt:
              'Make a public comment on the company emissions and reporting quality. Be as accurate as possible and include a summary of most important information. This will be used to inform the public about the company emissions and their reporting. Just reply with the information you can find in json format in Swedish: \n\n```json\n{\n "publicComment": "Företag X rapporterar utsläpp i Scope 3 från kategorierna Inköpta varor och tjänster (1), Bränsle- och energirelaterade aktiviteter (3), Uppströms transport och distribution (4), Avfall genererat i verksamheten (5), Affärsresor (6), Anställdas pendling (7), Nedströms transport och distribution (9), och Användning av sålda produkter (11). De har satt mål att nå netto nollutsläpp innan Y." \n}\n```',
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
      ],
      opts: {
        attempts: 3,
      },
    })

    //chain.job.moveToWaitingChildren(token)

    // Do something with job
    return response
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
