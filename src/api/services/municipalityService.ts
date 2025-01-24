import { readFileSync } from 'fs'

import { MunicipalitiesSchema } from '../schemas'
import { Municipality } from '../types'
import apiConfig from '../../config/api'

class MunicipalityService {
  private _all: Municipality[]
  private _lookup: Map<string, Municipality>

  private get allMunicipalities() {
    return this._all ?? this.lazyInit()._all
  }

  private get municipalitiesByName() {
    return this._lookup ?? this.lazyInit()._lookup
  }

  /**
   * Lazy load municipality data the first time it's requested.
   *
   * This reduces startup time and memory usage until the municipality data is actually needed.
   */
  private lazyInit() {
    const rawMunicipalities = JSON.parse(
      readFileSync(apiConfig.municipalityDataPath, 'utf-8')
    )

    // Ensure the data matches the expected format
    this._all = MunicipalitiesSchema.parse(rawMunicipalities)

    // Create a lookup for fast reads
    this._lookup = this._all.reduce((acc, municipality) => {
      acc.set(municipality.name.toLocaleLowerCase('sv-SE'), municipality)
      return acc
    }, new Map())

    return this
  }

  private transformYearlyData(data: Record<string, number>): Array<{year: string, value: number}> {
    return Object.entries(data).map(([year, value]) => ({
      year,
      value
    }))
  }

  getMunicipalities(): Municipality[] {
    return this.allMunicipalities.map(municipality => ({
      ...municipality,
      emissions: this.transformYearlyData(municipality.emissions),
      emissionBudget: this.transformYearlyData(municipality.emissionBudget),
      approximatedHistoricalEmission: this.transformYearlyData(municipality.approximatedHistoricalEmission),
      trend: this.transformYearlyData(municipality.trend),
      electricCarChangeYearly: this.transformYearlyData(municipality.electricCarChangeYearly)
    }))
  }

  getMunicipality(name: Municipality['name']): Municipality | null {
    const municipality = this.municipalitiesByName.get(name.toLocaleLowerCase('sv-SE'))
    if (!municipality) return null

    return {
      ...municipality,
      emissions: this.transformYearlyData(municipality.emissions),
      emissionBudget: this.transformYearlyData(municipality.emissionBudget),
      approximatedHistoricalEmission: this.transformYearlyData(municipality.approximatedHistoricalEmission),
      trend: this.transformYearlyData(municipality.trend),
      electricCarChangeYearly: this.transformYearlyData(municipality.electricCarChangeYearly)
    }
  }
}

export const municipalityService = new MunicipalityService()
