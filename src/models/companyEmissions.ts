export type YearEmissions = {
  year: number
  scope1: {
    emissions: number
    unit?: string
    baseYear?: string
  }
  scope2: {
    emissions: number
    unit?: number
    /** Market-based */
    mb: number
    /** Location-based */
    lb: number
    baseYear?: string
  }
  scope3: {
    emissions: number
    unit?: number
    baseYear?: string
    categories: {
      [key: string]: number
    }
  }
  totalEmissions?: string
  totalUnit?: string
}

export type CompanyData = {
  companyName: string
  industry?: string
  sector?: string
  industryGroup?: string
  baseYear?: string
  url?: string
  emissions: Array<YearEmissions>
  reliability?: string
  needsReview?: boolean
  reviewComment?: string
  reviewStatusCode?: string
  goals?: Array<{
    year: number
    target: number
    unit: string
  }>
  initiatives?: Array<{
    year: number
    description: string
  }>
}
