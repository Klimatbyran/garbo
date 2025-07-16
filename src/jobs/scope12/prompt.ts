
  export const prompt = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
  Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
  Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.
  
  **Units**:
  - Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
  - If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
  - All values must be converted to metric tons if they are provided in other units:
    - Example: 
      - 1000 CO2e → 1 tCO2e
      - 1000 CO2 → 1 tCO2
      - 1 kton CO2e → 1000 tCO2e
      - 1 Mton CO2 → 1,000,000 tCO2
  - Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.
  
  
  NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.
  
  *** Example***
  This is only an example format; do not include this specific data in the output and do not use markdown in the output:
  {
    "scope12": [{
      "year": 2023,
      "scope1": {
        "total": 12.3,
        "unit": "tCO2e"
      },
      "scope2": {
        "mb": 23.4, //null if not found
        "lb": 34.5, //null if not found
        "unknown": null, //null if not found
        "unit": "tCO2e"
      }
    }]
  }
  `
  
