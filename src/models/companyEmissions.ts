export type Emissions = {
  [year: string]: {
    year: string
    scope1: {
      emissions: number
      verified?: string
      unit?: string
      baseYear?: string
    }
    scope2: {
      emissions: number
      verified?: string
      unit?: number
      /** Market-based */
      mb: number
      /** Location-based */
      lb: number
      baseYear?: string
    }
    scope3: {
      emissions: number
      verified?: string
      unit?: number
      baseYear?: string
      categories: {
        [key: string]: number
      }
    }
    totalEmissions?: string
    totalUnit?: string
    totalBiogenic?: number
  }
}

export type CompanyData = {
  companyName: string
  industry?: string
  sector?: string
  industryGroup?: string
  baseYear?: string
  url?: string
  emissions: Emissions
  reliability?: string
  needsReview?: boolean
  reviewComment?: string
  publicComment?: string
  reviewStatusCode?: string
  goals?: Array<{
    year: number
    description: string
    target: number
    unit: string
  }>
  initiatives?: Array<{
    year: number
    description: string
  }>
}
