import { BaseCategoryWorker } from './baseCategory'

class Category14Worker extends BaseCategoryWorker {
  categoryNumber = 14
  categoryName = 'Franchises'
  queryTexts = [
    'Franchise operations',
    'Franchise emissions',
    'Franchise energy use',
    'Franchise locations',
    'Franchise standards',
    'Category 14 scope 3',
    'Franchise network'
  ]
  prompt = `Analyze the company's franchise operations to estimate Category 14 emissions.

Consider:
1. Number and types of franchised operations
2. Energy consumption patterns of typical franchises
3. Regional energy mix where franchises operate
4. Operational standards and requirements
5. Industry benchmarks for franchise emissions
6. Franchise growth and expansion plans
7. Any partial Category 14 data that may be reported
8. Typical franchise size and operations

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

export default new Category14Worker('estimateCategory14')
