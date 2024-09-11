export interface ReportingPeriod {
  id: number
  startDate: Date
  endDate: Date
  companyId: string
  emissionsId: number | null
  economyId: number | null
  metadataId: number
}

export type Scope1 = {
  total?: number
}

export type Scope2 = {
  mb?: number
  lb?: number
  unknown?: number
}
