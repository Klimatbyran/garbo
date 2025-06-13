export function calculatedTotalEmissions(emissions) {
    const { scope1, scope2, scope3 } = emissions || {};
    const scope2Total = scope2?.mb ?? scope2?.lb ?? scope2?.unknown;
    const scope3Total = scope3?.categories.reduce((total, category) => category.total + total, 0) || 0;
    return (scope1?.total ?? 0) + (scope2Total ?? 0) + scope3Total;
}

export type Unit = "tCO2" | "tCO2e";
export interface Scope1 {
    id?: string,
    total: number | null,
    unit: string
}

export interface Scope2 {
    id?: string,
    mb?: number | null,
    lb?: number | null,
    unknown?: number | null,
    unit: string
}

export interface Scope3Category {
    id?: string,
    category: number,
    total: number | null,
    unit: string
}
export interface Scope3 {
    categories: Scope3Category[],    
    statedTotalEmissions?: StatedTotalEmission
}

export interface StatedTotalEmission {
    id?: string,
    total: number | null,
    unit: string
}

export interface Emissions {
    id?: string,
    scope1?: Scope1 | null,
    scope2?: Scope2 | null,
    scope3?: Scope3 | null,
    statedTotalEmissions?: StatedTotalEmission
}

export interface ReportingPeriod {
    id?: string,
    startDate: string,
    endDate: string,
    reportURL: string,
    emissions: Emissions
}