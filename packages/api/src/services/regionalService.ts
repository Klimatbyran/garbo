import { readFileSync } from 'fs'

import { InputRegionalDataSchema } from '../schemas'
import { RegionalData, SectorEmissionsData } from '../types'
import apiConfig from '../../config/api'

class RegionalService {
  private _all: RegionalData[]
  private _lookup: Map<string, RegionalData>
  private _sectorEmissions: SectorEmissionsData[]

  private get allRegions() {
    return this._all ?? this.lazyInit()._all
  }

  private get regionsByName() {
    return this._lookup ?? this.lazyInit()._lookup
  }

  private get sectorEmissions() {
    return (
      this._sectorEmissions ?? this.lazyInitSectorEmissions()._sectorEmissions
    )
  }

  /**
   * Lazy load regional data the first time it's requested.
   *
   * This reduces startup time and memory usage until the regional data is actually needed.
   */
  private lazyInit() {
    const rawRegionalData = JSON.parse(
      readFileSync(apiConfig.regionDataPath, 'utf-8'),
    )

    // Validate and parse the data - InputRegionalDataSchema will handle transformation
    this._all = InputRegionalDataSchema.parse(rawRegionalData)

    // Create a lookup for fast reads
    this._lookup = this._all.reduce((acc, region) => {
      // Remove the suffixes "län" or "s län" from the region name and convert to lowercase
      const key = region.region.replace(/s?\slän$/i, '').toLowerCase()
      acc.set(key, region)
      return acc
    }, new Map())

    return this
  }

  getRegions() {
    return this.allRegions
  }

  getRegion(name: RegionalData['region']) {
    const normalizedName = name.replace(/s?\slän$/i, '').toLowerCase()
    return this.regionsByName.get(normalizedName) ?? null
  }

  getRegionalKpis() {
    return this.allRegions.map((region) => ({
      region: region.region,
      meetsParis: region.meetsParis,
      historicalEmissionChangePercent: region.historicalEmissionChangePercent,
    }))
  }

  /**
   * Lazy load regional sector emissions data the first time it's requested.
   */
  private lazyInitSectorEmissions() {
    try {
      this._sectorEmissions = JSON.parse(
        readFileSync(apiConfig.regionSectorEmissionsPath, 'utf-8'),
      )
    } catch {
      // If the file is empty or doesn't exist, initialize as empty array
      this._sectorEmissions = []
    }
    return this
  }

  getRegionSectorEmissions(name: RegionalData['region']) {
    const normalizedName = name.replace(/s?\slän$/i, '').toLowerCase()
    const region = this.sectorEmissions.find(
      (r) => r.name?.replace(/s?\slän$/i, '').toLowerCase() === normalizedName,
    )
    return region?.sectors ?? null
  }
}

export const regionalService = new RegionalService()
