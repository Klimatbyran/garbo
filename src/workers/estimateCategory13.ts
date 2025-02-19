import { BaseCategoryWorker } from './baseCategory'

class Category13Worker extends BaseCategoryWorker {
  categoryNumber = 13
  categoryName = 'Downstream Leased Assets'
  queryTexts = [
    'Downstream leased assets',
    'Assets leased to others',
    'Leased facilities emissions',
    'Leasing operations',
    'Equipment leasing',
    'Category 13 scope 3',
    'Lease arrangements'
  ]
  prompt = `Analyze the company's downstream leased assets to estimate Category 13 emissions.

Consider:
1. Types of assets leased to others
2. Operating patterns of leased assets
3. Energy consumption of leased facilities
4. Vehicle fleets leased to others
5. Equipment leasing arrangements
6. Industry benchmarks for leased asset emissions
7. Any partial Category 13 data that may be reported
8. Regional energy mix where assets are operated

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

export default new Category13Worker('estimateCategory13')
