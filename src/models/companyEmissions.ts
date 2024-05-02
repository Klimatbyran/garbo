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
    mb: number
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
  baseYear?: string
  url?: string
  emissions: Array<YearEmissions>
  reliability?: string
  needsReview?: boolean
  reviewComment?: string
  reviewStatusCode?: string
}
