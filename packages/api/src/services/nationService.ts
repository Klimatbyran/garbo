import { readFileSync } from 'fs'

import { InputNationalDataSchema } from '../schemas'
import { NationData, SectorEmissionsData } from '../types'
import apiConfig from '../../config/api'

class NationService {
  private _all: NationData[]
  private _sectorEmissions: SectorEmissionsData[]

  private get allNations() {
    return this._all ?? this.lazyInit()._all
  }

  private get sectorEmissions() {
    return (
      this._sectorEmissions ?? this.lazyInitSectorEmissions()._sectorEmissions
    )
  }

  /**
   * Lazy load nation data the first time it's requested.
   *
   * This reduces startup time and memory usage until the nation data is actually needed.
   */
  private lazyInit() {
    const rawNationData = JSON.parse(
      readFileSync(apiConfig.nationDataPath, 'utf-8'),
    )

    // Validate and parse the data - InputNationalDataSchema will handle transformation
    this._all = InputNationalDataSchema.parse(rawNationData)

    return this
  }

  getNations() {
    return this.allNations
  }

  getNation() {
    // Since there's only Sweden, return the first (and only) item
    return this.allNations[0] ?? null
  }

  /**
   * Lazy load nation sector emissions data the first time it's requested.
   */
  private lazyInitSectorEmissions() {
    try {
      this._sectorEmissions = JSON.parse(
        readFileSync(apiConfig.nationSectorEmissionsPath, 'utf-8'),
      )
    } catch (_error) {
      // If the file is empty or doesn't exist, initialize as empty array
      this._sectorEmissions = []
    }
    return this
  }

  getNationSectorEmissions() {
    // Since there's only Sweden, return the first (and only) item's sectors
    const nation = this.sectorEmissions[0]
    return nation?.sectors ?? null
  }
}

export const nationService = new NationService()
