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
      acc.set(municipality.kommun.toLocaleLowerCase('sv-SE'), municipality)
      return acc
    }, new Map())

    return this
  }

  getMunicipalities(): Municipality[] {
    return this.allMunicipalities
  }

  getMunicipality(name: Municipality['kommun']): Municipality | null {
    return (
      this.municipalitiesByName.get(name.toLocaleLowerCase('sv-SE')) ?? null
    )
  }
}

export const municipalityService = new MunicipalityService()
