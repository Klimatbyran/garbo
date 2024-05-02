export type YearEmissions = {
  year: number
  scope1: {
    emissions: number
    unit?: string
    baseYear?: string
  }
  scope2: {
    emissions: string
    unit?: number
    mb: string
    lb: string
    baseYear?: string
  }
  scope3: {
    emissions: string
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
