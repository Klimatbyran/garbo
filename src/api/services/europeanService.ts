import { readFileSync } from 'fs'

import { InputEuropeanDataSchema } from '../schemas'
import { EuropeanData, SectorEmissionsData } from '../types'
import apiConfig from '../../config/api'

class EuropeanService {
  private _all: EuropeanData[]
  private _lookup: Map<string, EuropeanData>
  private _sectorEmissions: SectorEmissionsData[]

  private get allEuropeans() {
    return this._all ?? this.lazyInit()._all
  }

  private get europeansByName() {
    return this._lookup ?? this.lazyInit()._lookup
  }

  private get sectorEmissions() {
    return (
      this._sectorEmissions ?? this.lazyInitSectorEmissions()._sectorEmissions
    )
  }

  /**
   * Lazy load European data the first time it's requested.
   *
   * This reduces startup time and memory usage until the European data is actually needed.
   */
  private lazyInit() {
    const rawEuropeanData = JSON.parse(
      readFileSync(apiConfig.europeanDataPath, 'utf-8'),
    )

    // Validate and parse the data - InputEuropeanDataSchema will handle transformation
    this._all = InputEuropeanDataSchema.parse(rawEuropeanData)

    // Create a lookup for fast reads
    this._lookup = this._all.reduce((acc, european) => {
      const key = european.country.toLowerCase()
      acc.set(key, european)
      return acc
    }, new Map())

    return this
  }

  getEuropeans() {
    return this.allEuropeans
  }

  getEuropean(name: EuropeanData['country']) {
    const normalizedName = name.toLowerCase()
    return this.europeansByName.get(normalizedName) ?? null
  }

  getEuropeanKpis() {
    return this.allEuropeans.map((european) => ({
      country: european.country,
      meetsParis: european.meetsParis,
      historicalEmissionChangePercent:
        european.historicalEmissionChangePercent,
    }))
  }

  /**
   * Lazy load European sector emissions data the first time it's requested.
   */
  private lazyInitSectorEmissions() {
    try {
      // Check if sector emissions file exists - for now, return empty array
      // This can be implemented when sector emissions data is available
      this._sectorEmissions = []
    } catch {
      // If the file is empty or doesn't exist, initialize as empty array
      this._sectorEmissions = []
    }
    return this
  }

  getEuropeanSectorEmissions(name: EuropeanData['country']) {
    const normalizedName = name.toLowerCase()
    const european = this.sectorEmissions.find(
      (e) => e.name?.toLowerCase() === normalizedName,
    )
    return european?.sectors ?? null
  }
}

export const europeanService = new EuropeanService()
