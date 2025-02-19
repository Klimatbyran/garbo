import { BaseCategoryWorker } from './baseCategory'

class Category1Worker extends BaseCategoryWorker {
  categoryNumber = 1
  categoryName = 'Purchased Goods and Services'
  queryTexts = [
    'Purchased goods and services',
    'Supply chain emissions',
    'Procurement data',
    'Supplier emissions',
    'Material purchases',
    'Category 1 scope 3',
    'Upstream emissions'
  ]
  prompt = `Analyze the company's supply chain and procurement data to estimate Category 1 emissions.

Consider:
1. Company's industry and typical supply chain structure
2. Reported turnover and its relationship to procurement
3. Any mentions of major suppliers or procurement categories
4. Industry benchmarks and typical emissions factors
5. Reported Scope 1 & 2 emissions as context
6. Any partial Category 1 data that may be reported

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

export default new Category1Worker('estimateCategory1')
