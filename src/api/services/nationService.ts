import { readFileSync, statSync } from 'fs'

import { InputNationalDataSchema } from '../schemas'
import { NationData, SectorEmissionsData } from '../types'
import apiConfig from '../../config/api'

class NationService {
  private _all: NationData[]
  private _allLoadedAt: Date | null = null
  private _sectorEmissions: SectorEmissionsData[]
  private _sectorEmissionsLoadedAt: Date | null = null

  private isFileNewerThanCache(filePath: string, loadedAt: Date | null) {
    if (!loadedAt) return true
    return statSync(filePath).mtime > loadedAt
  }

  private get allNations() {
    if (
      this.isFileNewerThanCache(apiConfig.nationDataPath, this._allLoadedAt)
    ) {
      this.lazyInit()
    }
    return this._all
  }

  private get sectorEmissions() {
    if (
      this.isFileNewerThanCache(
        apiConfig.nationSectorEmissionsPath,
        this._sectorEmissionsLoadedAt
      )
    ) {
      this.lazyInitSectorEmissions()
    }
    return this._sectorEmissions
  }

  /**
   * Lazy load nation data the first time it's requested, and reload if the
   * source file has been modified since the last load.
   */
  private lazyInit() {
    const rawNationData = JSON.parse(
      readFileSync(apiConfig.nationDataPath, 'utf-8')
    )

    // Validate and parse the data - InputNationalDataSchema will handle transformation
    this._all = InputNationalDataSchema.parse(rawNationData)
    this._allLoadedAt = new Date()

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
   * Lazy load nation sector emissions data the first time it's requested, and
   * reload if the source file has been modified since the last load.
   */
  private lazyInitSectorEmissions() {
    try {
      this._sectorEmissions = JSON.parse(
        readFileSync(apiConfig.nationSectorEmissionsPath, 'utf-8')
      )
    } catch (_error) {
      // If the file is empty or doesn't exist, initialize as empty array
      this._sectorEmissions = []
    }
    this._sectorEmissionsLoadedAt = new Date()
    return this
  }

  getNationSectorEmissions() {
    // Since there's only Sweden, return the first (and only) item's sectors
    const nation = this.sectorEmissions[0]
    return nation?.sectors ?? null
  }
}

export const nationService = new NationService()
