import { readFileSync } from 'fs'

import { InputMunicipalitiesSchema } from '../schemas'
import { Municipality, SectorEmissionsData } from '../types'
import apiConfig from '../../config/api'

class MunicipalityService {
  private _all: Municipality[]
  private _lookup: Map<string, Municipality>
  private _sectorEmissions: SectorEmissionsData[]

  private get allMunicipalities() {
    return this._all ?? this.lazyInit()._all
  }

  private get municipalitiesByName() {
    return this._lookup ?? this.lazyInit()._lookup
  }

  private get sectorEmissions() {
    return (
      this._sectorEmissions ?? this.lazyInitSectorEmissions()._sectorEmissions
    )
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
    this._all = InputMunicipalitiesSchema.parse(rawMunicipalities)

    // Create a lookup for fast reads
    this._lookup = this._all.reduce((acc, municipality) => {
      acc.set(municipality.name.toLocaleLowerCase('sv-SE'), municipality)
      return acc
    }, new Map())

    return this
  }

  /**
   * Lazy load municipality sector emissions data the first time it's requested.
   */
  private lazyInitSectorEmissions() {
    this._sectorEmissions = JSON.parse(
      readFileSync(apiConfig.municipalitySectorEmissionsPath, 'utf-8')
    )
    return this
  }

  getMunicipalities(): Municipality[] {
    return this.allMunicipalities
  }

  getMunicipality(name: Municipality['name']): Municipality | null {
    return (
      this.municipalitiesByName.get(name.toLocaleLowerCase('sv-SE')) ?? null
    )
  }

  getMunicipalitySectorEmissions(name: Municipality['name']) {
    const municipality = this.sectorEmissions.find(
      (m) => m.name.toLowerCase() === name.toLowerCase()
    )
    return municipality?.sectors ?? null
  }
}

export const municipalityService = new MunicipalityService()
