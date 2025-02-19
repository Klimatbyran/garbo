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
}

export default new Category1Worker('estimateCategory1')
