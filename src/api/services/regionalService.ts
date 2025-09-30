import { readFileSync } from 'fs'

import { InputRegionalDataSchema } from '../schemas'
import { RegionalData } from '../types'
import apiConfig from '../../config/api'

class RegionalService {
  private _all: RegionalData[]
  private _lookup: Map<string, RegionalData>
  private _sectorEmissions: Record<string, unknown>

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

    // Transform the regional data from the nested format to a flat array
    this._all = Object.entries(rawRegionalData).map(([regionName, data]) => {
      const regionData = data as Record<string, any>
      const emissions: Record<string, number> = {}

      // Extract only total_emissions for each year
      for (const [year, yearData] of Object.entries(regionData)) {
        if (
          yearData &&
          typeof yearData === 'object' &&
          'total_emissions' in yearData
        ) {
          emissions[year] = yearData.total_emissions
        }
      }

      return {
        name: regionName,
        emissions,
      }
    })

    // Validate the transformed data
    this._all = InputRegionalDataSchema.parse(this._all)

    // Create a lookup for fast reads
    this._lookup = this._all.reduce((acc, region) => {
      acc.set(region.name.toLowerCase(), region)
      return acc
    }, new Map())

    return this
  }

  /**
   * Lazy load regional sector emissions data the first time it's requested.
   */
  private lazyInitSectorEmissions() {
    const rawRegionalData = JSON.parse(
      readFileSync(apiConfig.regionDataPath, 'utf-8'),
    )

    this._sectorEmissions = rawRegionalData

    return this
  }

  getRegions() {
    return this.allRegions
  }

  getRegion(name: RegionalData['name']) {
    return this.regionsByName.get(name.toLowerCase()) ?? null
  }

  getRegionalSectorEmissions(name: RegionalData['name']) {
    // Find the correct case-sensitive key by checking all keys
    const regionKey = Object.keys(this.sectorEmissions).find(
      (key) => key.toLowerCase() === name.toLowerCase(),
    )

    if (!regionKey) {
      return null
    }

    const region = this.sectorEmissions[regionKey]
    return region ?? null
  }
}

export const regionalService = new RegionalService()
