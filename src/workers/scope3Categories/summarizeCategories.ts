import { DiscordJob, DiscordWorker } from '../../lib/DiscordWorker'
import { Scope3CategoryAnalysis } from '../../schemas/scope3CategoryAnalysis'

export class SummarizeCategoriesJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    categoryAnalyses: Record<string, Scope3CategoryAnalysis>
    year: number
  }
}

const summarizeCategories = new DiscordWorker<SummarizeCategoriesJob>(
  'summarizeCategories',
  async (job) => {
    const { companyName, categoryAnalyses, year } = job.data

    // Convert category analyses into scope3 data structure
    const categories = Object.entries(categoryAnalyses).map(([category, analysis]) => ({
      category: parseInt(category),
      total: analysis.analysis.estimatedEmissions.value,
      unit: analysis.analysis.estimatedEmissions.unit
    }))

    const scope3Data = {
      scope3: [{
        year,
        scope3: {
          categories,
          statedTotalEmissions: null // We don't calculate totals
        }
      }]
    }

    await job.sendMessage(`
📊 Scope 3 Category Summary for ${companyName}:

Estimated categories for ${year}:
${categories.map(c => `Category ${c.category}: ${c.total} ${c.unit}`).join('\n')}
`)

    return scope3Data
  }
)

export default summarizeCategories
