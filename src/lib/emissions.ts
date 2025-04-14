export function calculatedTotalEmissions(emissions) {
    const { scope1, scope2, scope3 } = emissions || {};
    const scope2Total = scope2?.mb ?? scope2?.lb ?? scope2?.unknown;
    const scope3Total = scope3?.categories.reduce((total, category) => category.total + total, 0) || 0;
    return (scope1?.total ?? 0) + (scope2Total ?? 0) + scope3Total;
}