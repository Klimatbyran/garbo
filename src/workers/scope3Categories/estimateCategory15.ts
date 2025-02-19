import { BaseCategoryWorker } from './baseCategory'

class Category15Worker extends BaseCategoryWorker {
  categoryNumber = 15
  categoryName = 'Investments'
  queryTexts = [
    'Investment emissions',
    'Portfolio emissions',
    'Financed emissions',
    'Investment holdings',
    'Project finance',
    'Category 15 scope 3',
    'Investment carbon footprint'
  ]
  prompt = `Analyze the company's investment portfolio to estimate Category 15 emissions.

Consider:
1. Types of investments (equity, debt, project finance)
2. Investment portfolio composition
3. Sectors and industries invested in
4. Investment holding periods
5. Project finance emissions
6. Industry benchmarks for investment emissions
7. Any partial Category 15 data that may be reported
8. Financial sector specific guidance

Provide a detailed analysis including:
1. Estimated emissions with confidence level
2. Reasoning behind the estimate
3. Methodology used
4. Data gaps identified
5. Recommendations for improving data quality
6. Relevant factors that influenced the estimate

Use industry-specific emission factors and benchmarks where appropriate.
Be conservative in estimates and clearly state assumptions.`
}

export default new Category15Worker('estimateCategory15')
