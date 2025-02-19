import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { FlowProducer } from 'bullmq'
import redis from '../config/redis'

export class VerifyScope3Job extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    industry: string
    scope3Data: any
    missingCategories: string[]
  }
}

const verifyScope3 = new DiscordWorker<VerifyScope3Job>(
  'verifyScope3',
  async (job) => {
    const { url, companyName, industry, scope3Data, missingCategories } =
      job.data

    // Get relevant context about scope 3 from the PDF
    const markdown = await vectorDB.getRelevantMarkdown(
      url,
      [
        'Scope 3 emissions',
        'Value chain emissions',
        'Indirect emissions',
        ...missingCategories.map((cat) => `Scope 3 category ${cat}`),
      ],
      5
    )

    const response = await askStream(
      [
        {
          role: 'system',
          content:
            'You are an expert in GHG Protocol Scope 3 reporting requirements.',
        },
        {
          role: 'user',
          content: `Analyze the scope 3 reporting for ${companyName} (${industry}). 
          
Current scope 3 data:
${JSON.stringify(scope3Data, null, 2)}

Missing categories: ${missingCategories.join(', ')}

Context from report:
${markdown}

Provide a detailed analysis of why these categories are missing and if they should be material for this type of company.`,
        },
      ],
      {
        response_format: { type: 'json_schema' },
      }
    )

    await job.sendMessage(`
🔍 Scope 3 Analysis for ${companyName}:

${response}

Next steps:
1. Review the analysis above
2. Consider requesting additional information for material missing categories
3. Update the scope 3 data if new information is found
`)

    // Create flows for category estimations based on analysis
    const flow = new FlowProducer({ connection: redis })

    // Analyze response to identify material categories
    const materialCategories = missingCategories.filter((category) => {
      return (
        response.toLowerCase().includes(`category ${category}`) &&
        response.toLowerCase().includes('material')
      )
    })

    if (materialCategories.length > 0) {
      // Create category estimation jobs
      const categoryJobs = materialCategories.map((category) => ({
        name: `estimateCategory${category}-${job.data.companyName}`,
        queueName: `estimateCategory${category}`,
        data: {
          ...job.data,
          scope12Data: emissionsData.scope12,
          scope3Data: emissionsData.scope3,
          economy: emissionsData.economy,
          industry: job.data.industry,
        },
      }))

      const latestYear = Math.max(
        ...(emissionsData.scope12?.map((d) => d.year) || []),
        ...(emissionsData.scope3?.map((d) => d.year) || []),
        new Date().getFullYear() - 1
      )

      // Create a flow with summarization as parent and category estimations as children
      await flow.add({
        name: `summarizeCategories-${job.data.companyName}`,
        queueName: 'summarizeCategories',
        data: {
          ...job.data,
          year: latestYear,
          categories: materialCategories,
        },
        children: categoryJobs,
      })

      await job.sendMessage(`
📊 Starting estimation for ${
        materialCategories.length
      } material Scope 3 categories:
${materialCategories.map((c) => `- Category ${c}`).join('\n')}
`)
    }

    // Create flows for category estimations based on analysis
    const flow = new FlowProducer({ connection: redis })

    const latestYear = Math.max(
      ...(emissionsData.scope12?.map((d) => d.year) || []),
      ...(emissionsData.scope3?.map((d) => d.year) || []),
      new Date().getFullYear() - 1
    )

    // Create category estimation flows based on materiality analysis
    const materialCategories = missingCategories.filter((category) => {
      // Check if this category was mentioned as material in the analysis
      return (
        response.toLowerCase().includes(`category ${category}`) &&
        response.toLowerCase().includes('material')
      )
    })

    if (materialCategories.length > 0) {
      // Create a flow for each material category
      const categoryFlows = materialCategories.map((category) => ({
        name: `estimateCategory${category}-${job.data.companyName}`,
        queueName: `estimateCategory${category}`,
        data: {
          ...job.data,
          scope12Data: emissionsData.scope12,
          scope3Data: emissionsData.scope3,
          economy: emissionsData.economy,
          industry: job.data.industry,
        },
      }))

      // Create a summarization flow that depends on all category estimations
      await flow.add({
        name: `summarizeCategories-${job.data.companyName}`,
        queueName: 'summarizeCategories',
        data: {
          ...job.data,
          year: latestYear,
          categories: materialCategories,
        },
        children: categoryFlows,
      })

      await job.sendMessage(`
📊 Starting estimation for ${
        materialCategories.length
      } material Scope 3 categories:
${materialCategories.map((c) => `- Category ${c}`).join('\n')}
`)
    }

    return { analysis: response }
  }
)

export default verifyScope3
