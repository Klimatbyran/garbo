import { Economy, Emissions, Goal, Industry, Initiative, ReportingPeriod, Scope2, Scope3 } from "../types";

export interface ChangeDescription {
  name: string;
  value?: number | string | boolean | null;
  previousValue?: number | string | boolean | null;
  unit?: string;
  keys?: string[];
};

const dateToYear = (date: string) => new Date(date).getFullYear().toString();

export function changesReportingPeriods(newReportingPeriods: ReportingPeriod[], oldReportingPeriods: ReportingPeriod[] = []): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  for(const newReportingPeriod of newReportingPeriods) {
    const oldReportingPeriod = oldReportingPeriods.find(rp => rp.startDate.startsWith(newReportingPeriod.startDate) && rp.endDate.startsWith(newReportingPeriod.endDate));
    changes.push(...changesReportingPeriod(newReportingPeriod, oldReportingPeriod));
  }
  return changes;
}

export function changesReportingPeriod(newReportingPeriod?: ReportingPeriod, oldReportingPeriod?: ReportingPeriod): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  if(!newReportingPeriod) return changes;
  changes.push(
    ...changesEmissions( dateToYear(newReportingPeriod.endDate), newReportingPeriod?.emissions, oldReportingPeriod?.emissions),
    ...changesEconomy(dateToYear(newReportingPeriod.endDate), newReportingPeriod.economy, oldReportingPeriod?.economy)
  );
  return changes;
}

export function changesEmissions(year: string, newEmissions?: Emissions, oldEmissions?: Emissions): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  changes.push(
    ...changesValue("Scope 1", ["emissions", year], { value: newEmissions?.scope1?.total, unit: newEmissions?.scope1?.unit}, { value: oldEmissions?.scope1?.total, unit: oldEmissions?.scope1?.unit}),
    ...changesValue("Stated total emissions", ["emissions", year], { value: newEmissions?.statedTotalEmissions?.total, unit: newEmissions?.statedTotalEmissions?.unit}, { value: oldEmissions?.statedTotalEmissions?.total, unit: oldEmissions?.statedTotalEmissions?.unit}),    
    ...changesValue("Biogenic", ["emissions", year], { value: newEmissions?.biogenic?.total, unit: newEmissions?.biogenic?.unit}, { value: oldEmissions?.biogenic?.total, unit: oldEmissions?.biogenic?.unit}),
    ...changesScope2(year, newEmissions?.scope2, oldEmissions?.scope2),
    ...changesScope3(year, newEmissions?.scope3, oldEmissions?.scope3)
  );
  return changes;
}

export function changesValue(name: string, keys: string[], newValue: { value?: number | string, unit?: string }, oldValue: { value?: number | string, unit?: string }): ChangeDescription[] {
  if(oldValue.value === undefined && newValue.value) {
    return [{ name, value: newValue.value, previousValue: undefined, unit: newValue.unit, keys}];
  } 
  if(oldValue.value && newValue.value && oldValue.value !== newValue.value) {
    return [{ name, value: newValue.value, previousValue: oldValue.value, unit: newValue.unit, keys}]
  };
  return [];
}

export function changesScope3(year: string, newScope3?: Scope3, oldScope3?: Scope3): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  for(const scope3Category of newScope3?.categories || []) {
    const oldScope3Category = oldScope3?.categories.find(c => c.category === scope3Category.category);
    changes.push(...changesValue(`Scope3 ${scope3Category.category}`, ["emissions", year], {value: scope3Category.total, unit: scope3Category.unit}, {value: oldScope3Category?.total, unit: oldScope3Category?.unit}));
  }
  changes.push(...changesValue(`Scope3 StatedTotalEmissions`, ["emissions", year], {value: newScope3?.statedTotalEmissions?.total, unit: newScope3?.statedTotalEmissions?.unit}, {value: oldScope3?.statedTotalEmissions?.total, unit: oldScope3?.statedTotalEmissions?.unit}));
  return changes;
}

export function changesScope2(year: string, newScope2?: Scope2, oldScope2?: Scope2): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  changes.push(...changesValue(`Scope2 Location-based`, ["emissions", year], {value: newScope2?.lb, unit: newScope2?.unit || "tCO2e"}, {value: oldScope2?.lb, unit: oldScope2?.unit || "tCO2e"}));
  changes.push(...changesValue(`Scope2 Market-based`, ["emissions", year], {value: newScope2?.mb, unit: newScope2?.unit || "tCO2e"}, {value: oldScope2?.mb, unit: oldScope2?.unit || "tCO2e"}));
  changes.push(...changesValue(`Scope2 Unknown`, ["emissions", year], {value: newScope2?.unknown, unit: newScope2?.unit || "tCO2e"}, {value: oldScope2?.unknown, unit: oldScope2?.unit || "tCO2e"}));
  return changes;
}

export function changesEconomy(year: string, newEconomy?: Economy, oldEconomy?: Economy): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  changes.push(...changesValue("Turnover", ["turnover", "economy", year], {value: newEconomy?.turnover?.value, unit: newEconomy?.turnover?.currency}, {value: oldEconomy?.turnover?.value, unit: oldEconomy?.turnover?.currency}));
  changes.push(...changesValue("Employees", ["employees", "economy", year], {value: newEconomy?.employees?.value, unit: newEconomy?.employees?.unit}, {value: oldEconomy?.employees?.value, unit: oldEconomy?.employees?.unit}));
  return changes;
}

export function changesBaseYear(newBaseYear?: number, oldBaseYear?: number): ChangeDescription[] {
  return changesValue("Base Year", ["baseYear"], {value: newBaseYear}, {value: oldBaseYear});
}

export function changesGoal(keys: string[], newGoal?: Goal, oldGoal?: Goal): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  changes.push(
    ...changesValue("Goal Description", ["goals", "description", ...keys], {value: newGoal?.description}, {value: oldGoal?.description}),
    ...changesValue("Goal Year", ["goals", "year", ...keys], {value: newGoal?.year}, {value: oldGoal?.year}),
    ...changesValue("Goal Target", ["goals", "target", ...keys], {value: newGoal?.target}, {value: oldGoal?.target}),
    ...changesValue("Goal Base Year", ["goals", "baseYear", ...keys], {value: newGoal?.baseYear}, {value: oldGoal?.baseYear})
  );
  return changes;
}

export function changesGoals(newGoals: Goal[], oldGoals: Goal[]): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  let i = 0;
  for(const newGoal of newGoals) {
    const oldGoal = oldGoals.find(g => g.description === newGoal.description);
    changes.push(...changesGoal([i.toString()], newGoal, oldGoal));
    i++;
  }
  return changes;
}

export function changesIndustry(newIndustry: Industry, oldIndustry: Industry): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  changes.push(
    ...changesValue("Industry", ["industry"], {value: newIndustry.subIndustryCode}, {value: oldIndustry.subIndustryCode}),
  );
  return changes;
}

export function changesInitiatives(newInitiatives: Initiative[], oldInitiatives: Initiative[]): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  let i = 0;
  for(const newInitiative of newInitiatives) {
    const oldInitiative = oldInitiatives.find(g => g.title === newInitiative.title);
    changes.push(...changesInitiative([i.toString()], newInitiative, oldInitiative));
    i++;
  }
  return changes;
}

export function changesInitiative(keys: string[], newInitiative?: Initiative, oldInitiative?: Initiative): ChangeDescription[] {
  const changes: ChangeDescription[] = [];
  changes.push(
    ...changesValue("Initiative Title", ["initiatives", "title", ...keys], {value: newInitiative?.title}, {value: oldInitiative?.title}),
    ...changesValue("Initiative Description", ["initiatives", "description", ...keys], {value: newInitiative?.description}, {value: oldInitiative?.description}),
    ...changesValue("Initiative Year", ["initiatives", "year", ...keys], {value: newInitiative?.year}, {value: oldInitiative?.year}),
    ...changesValue("Initiative Scope", ["initiatives", "scope", ...keys], {value: newInitiative?.scope}, {value: oldInitiative?.scope}),
  );
  return changes;
}

export function changesRequireApproval(changes: ChangeDescription[]): boolean {
  return changes.some(c => c.previousValue !== undefined);
}