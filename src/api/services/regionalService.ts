import { readFileSync } from 'fs'

import { InputRegionalDataSchema } from '../schemas'
import { RegionalData } from '../types'
import apiConfig from '../../config/api'

class RegionalService {
  private _all: RegionalData[]
  private _lookup: Map<string, RegionalData>

  private get allRegions() {
    return this._all ?? this.lazyInit()._all
  }

  private get regionsByName() {
    return this._lookup ?? this.lazyInit()._lookup
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
}

export const regionalService = new RegionalService()
