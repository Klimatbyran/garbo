
  export const oldPrompt = `
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
  - If you get some variation of the unit in metric tons, CO2e, CO2, or tCO2e, tCO2, tCO2e, use the wording **tCO2e** (with the "e" suffix).

  
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



  export const lantmannenTest = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
  Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
  Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.
  
  **Units**:
  - Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
  - All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
  - Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
  - If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
  - If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
  - All values must be converted to metric tons if they are provided in other units:
    - Example: 
      - 1000 CO2e → 1 tCO2e
      - 1000 CO2 → 1 tCO2
      - 1 kton CO2e → 1000 tCO2e
      - 1 Mton CO2 → 1,000,000 tCO2
  - Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

  Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons




  
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



  export const lantmannenTestUnkonwnStress = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
  Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
  Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.
  
  **Units**:
  - Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
  - All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
  - Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
  - If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
  - If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
  - All values must be converted to metric tons if they are provided in other units:
    - Example: 
      - 1000 CO2e → 1 tCO2e
      - 1000 CO2 → 1 tCO2
      - 1 kton CO2e → 1000 tCO2e
      - 1 Mton CO2 → 1,000,000 tCO2
  - Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

  Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons


    **Scope 2 Classification Rules - CRITICAL:**
  - ONLY use "mb" (market-based) if the document explicitly mentions "market-based", "market approach", or similar terminology
  - ONLY use "lb" (location-based) if the document explicitly mentions "location-based", "location approach", or similar terminology  
  - If scope 2 emissions are mentioned but WITHOUT clear indication of method, put the value in "unknown" field
  - Set unused fields (mb/lb/unknown) to null
  - DO NOT assume market-based is the default - this is a common error
  

  
  NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.
  
  *** Example***
  //   This is only an example format; do not include this specific data in the output and do not use markdown in the output:

  // Case 1: Method explicitly stated
  {
    "scope12": [{
      "year": 2023,
      "scope1": { "total": 12.3, "unit": "tCO2e" },
      "scope2": { "mb": 23.4, "lb": null, "unknown": null, "unit": "tCO2e" }
    }]
  }
  
  // Case 2: Method NOT specified - use unknown
  {
    "scope12": [{
      "year": 2023,
      "scope1": { "total": 12.3, "unit": "tCO2e" },
      "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e" }
    }]
  }
  `


  export const lantmannenTestBalancedUnknownMb = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
  Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
  Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.
  
  **Units**:
  - Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
  - All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
  - Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
  - If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
  - If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
  - All values must be converted to metric tons if they are provided in other units:
    - Example: 
      - 1000 CO2e → 1 tCO2e
      - 1000 CO2 → 1 tCO2
      - 1 kton CO2e → 1000 tCO2e
      - 1 Mton CO2 → 1,000,000 tCO2
  - Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

  Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons


  - If there is any mention of location based or market based anywhere in the document, add the quote from the document in mentionOfLocationBasedOrMarketBased.

- EXTREMELY IMPORTANT: Do not assume any method and DO NOT infer if it is location based or market based based on energy use or other information, just use their explicit method statement to decide if you put values in the field for lb (location-based), mb (market-based) or unknown. 
- CRITICAL RULE: If the document states they use a methodology IN GENERAL (e.g., "we use market-based approach"), then ALL scope 2 values in that document are classified with that method. You do NOT need individual values to be labeled - the general statement applies to everything.
- ONLY use "unknown" if NO methodology is mentioned ANYWHERE in the document.  - ALWAYS PUT THE VALUES IN THE UNKNOWN FIELD IF NO METHOD IS MENTIONED: "No method is mentioned, so the values are put in the unknown field."

- FORBIDDEN REASONING: Never say "specific value is not labeled" or "value not explicitly stated as market-based" - this reasoning is incorrect and forbidden.


  - Fill in explanationOfWhyYouPutValuesToMbOrLbOrUnknown with a short explanation of why you put the values in the field for mb (market-based), lb (location-based) or unknown. Then put the values in the corresponding field.

  IMPORTANT: 
  1. First: fill in mentionOfLocationBasedOrMarketBased, try to find a quote from the document. 
  2. Second: Use that to create an explanation for explanationOfWhyYouPutValuesToMbOrLbOrUnknown. IMPORTANT: A general method applies to all values so if they have mention using market-based, then all values are market-based. They do not have to state a method for each specific value.
  3. Third:Only after that you put the values in the corresponding field. 

  
  NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.
  
  *** Example***
  //   This is only an example format; do not include this specific data in the output and do not use markdown in the output:

  // Case 1: Method explicitly stated
  {
    "scope12": [{
      "year": 2023,
      "scope1": { "total": 12.3, "unit": "tCO2e" },
      "scope2": { "mb": 23.4, "lb": null, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": "We use market-based methodology", "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field." }
    }]
  }
  
  // Case 2: Method NOT specified - use unknown
  {
    "scope12": [{
      "year": 2023,
      "scope1": { "total": 12.3, "unit": "tCO2e" },
      "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": null, "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No method is mentioned, so the values are put in the unknown field." } // if there is no method ALWAYS put to unknown, never anywhere else.
    }]
  }
  `


  export const splitFiscalYearTest = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
  Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year. 
  Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.
  
  **Units**:
  - Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
  - All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
  - Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
  - If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
  - If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
  - All values must be converted to metric tons if they are provided in other units:
    - Example: 
      - 1000 CO2e → 1 tCO2e
      - 1000 CO2 → 1 tCO2
      - 1 kton CO2e → 1000 tCO2e
      - 1 Mton CO2 → 1,000,000 tCO2
  - Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

  Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons


  - If there is any mention of location based or market based anywhere in the document, add the quote from the document in mentionOfLocationBasedOrMarketBased.

- EXTREMELY IMPORTANT: Do not assume any method and DO NOT infer if it is location based or market based based on energy use or other information, just use their explicit method statement to decide if you put values in the field for lb (location-based), mb (market-based) or unknown. 
- CRITICAL RULE: If the document states they use a methodology IN GENERAL (e.g., "we use market-based approach"), then ALL scope 2 values in that document are classified with that method. You do NOT need individual values to be labeled - the general statement applies to everything.
- ONLY use "unknown" if NO methodology is mentioned ANYWHERE in the document.  - ALWAYS PUT THE VALUES IN THE UNKNOWN FIELD IF NO METHOD IS MENTIONED: "No method is mentioned, so the values are put in the unknown field."

- FORBIDDEN REASONING: Never say "specific value is not labeled" or "value not explicitly stated as market-based" - this reasoning is incorrect and forbidden.


  - Fill in explanationOfWhyYouPutValuesToMbOrLbOrUnknown with a short explanation of why you put the values in the field for mb (market-based), lb (location-based) or unknown. Then put the values in the corresponding field.

  IMPORTANT: 
  1. First: fill in mentionOfLocationBasedOrMarketBased, try to find a quote from the document. 
  2. Second: Use that to create an explanation for explanationOfWhyYouPutValuesToMbOrLbOrUnknown. IMPORTANT: A general method applies to all values so if they have mention using market-based, then all values are market-based. They do not have to state a method for each specific value.
  3. Third:Only after that you put the values in the corresponding field. 

  For any fiscal year notation (2015/16, FY16, etc.), always use the ENDING year (2016) in your output.

  NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.
  


  *** Example***
  //   This is only an example format; do not include this specific data in the output and do not use markdown in the output:

  // Case 1: Method explicitly stated
  {
    "scope12": [{
      "year": 2023,
      "scope1": { "total": 12.3, "unit": "tCO2e" },
      "scope2": { "mb": 23.4, "lb": null, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": "We use market-based methodology", "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field." }
    }]
  }
  
  // Case 2: Method NOT specified - use unknown
  {
    "scope12": [{
      "year": 2023,
      "scope1": { "total": 12.3, "unit": "tCO2e" },
      "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": null, "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No method is mentioned, so the values are put in the unknown field." } // if there is no method ALWAYS put to unknown, never anywhere else.
    }]
  }
  `



   // current "best"
   export const promptUntil26November = `
   *** Golden Rule ***
   - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
   
   Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year. 
   Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.
   
   **Units**:
   - Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
   - All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
   - Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
   - If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
   - If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
   - All values must be converted to metric tons if they are provided in other units:
     - Example: 
       - 1000 CO2e → 1 tCO2e
       - 1000 CO2 → 1 tCO2
       - 1 kton CO2e → 1000 tCO2e
       - 1 Mton CO2 → 1,000,000 tCO2
   - Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.
 
   Always expand abbreviated units to their full numerical value. Convert:
 
 X thousand tons → X × 1,000 tons
 X million tons → X × 1,000,000 tons
 etc.
 Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons
 
 
   - If there is any mention of location based or market based anywhere in the document, add the quote from the document in mentionOfLocationBasedOrMarketBased.
 
 - EXTREMELY IMPORTANT: Do not assume any method and DO NOT infer if it is location based or market based based on energy use or other information, just use their explicit method statement to decide if you put values in the field for lb (location-based), mb (market-based), both or unknown. 
 - CRITICAL RULE: If the document states they use a methodology IN GENERAL (e.g., "we use market-based approach"), then ALL scope 2 values in that document are classified with that method. You do NOT need individual values to be labeled - the general statement applies to everything.
 - ONLY use "unknown" if NO methodology is mentioned ANYWHERE in the document.  - ALWAYS PUT THE VALUES IN THE UNKNOWN FIELD IF NO METHOD IS MENTIONED: "No method is mentioned, so the values are put in the unknown field."
 
 - FORBIDDEN REASONING: Never say "specific value is not labeled" or "value not explicitly stated as market-based" - this reasoning is incorrect and forbidden.
 
 
   - Fill in explanationOfWhyYouPutValuesToMbOrLbOrUnknown with a short explanation of why you put the values in the field for mb (market-based), lb (location-based), both mb and lb or unknown. Then put the values in the corresponding field.
 
   IMPORTANT: 
   1. First: LOOK CAREFULLY and find ALL mentions of market based and location based methods in the document and add ALL OF THEM to the array mentionOfLocationBasedOrMarketBased. Make sure to include both market based and location based if both are stated!
   2. Second: Use that to create an explanation for explanationOfWhyYouPutValuesToMbOrLbOrUnknown.
   3. Third:Only after that you put the values in the corresponding field or fields. 
 
   For any fiscal year notation (2015/16, FY16, etc.), always use the ENDING year (2016) in your output.
 
   NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.
   
 
 
   *** Example***
   //   This is only an example format; do not include this specific data in the output and do not use markdown in the output:
 
   // Case 1: Method explicitly stated
   {
     "scope12": [{
       "year": 2023,
       "scope1": { "total": 12.3, "unit": "tCO2e" },
       "scope2": { "mb": 23.4, "lb": null, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field." }
     }]
   }


   
   // Case 2: Method NOT specified - use unknown
   {
     "scope12": [{
       "year": 2023,
       "scope1": { "total": 12.3, "unit": "tCO2e" },
       "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": null, "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No method is mentioned, so the values are put in the unknown field." } // if there is no method ALWAYS put to unknown, never anywhere else.
     }]
   }

     // Case 3: Both methods are stated
   {
     "scope12": [{
       "year": 2023,
       "scope1": { "total": 12.3  , "unit": "tCO2e" },
       "scope2": { "mb": 23.4, "lb": 34.5, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology", "We use location-based methodology", "Market-based emissions", "Location-based emissions"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use both market-based and location-based methodology. That means some values are market-based and added to the mb field and others are location-based and added to the lb field." }
     }]
   }

   // Case 4: No data for any year
   {
    "scope12": []
   }
   `

      // current "best"
      export const bothMBandLBtest = `
      *** Golden Rule ***
      - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
      
      Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year. 
      Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.
      
      **Units**:
      - Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
      - All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
      - Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
      - If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
      - If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
      - All values must be converted to metric tons if they are provided in other units:
        - Example: 
          - 1000 CO2e → 1 tCO2e
          - 1000 CO2 → 1 tCO2
          - 1 kton CO2e → 1000 tCO2e
          - 1 Mton CO2 → 1,000,000 tCO2
      - Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.
    
      Always expand abbreviated units to their full numerical value. Convert:
    
    X thousand tons → X × 1,000 tons
    X million tons → X × 1,000,000 tons
    etc.
    Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons
    
    
      - If there is any mention of location based or market based anywhere in the document, add the quote from the document in mentionOfLocationBasedOrMarketBased.
    
    - EXTREMELY IMPORTANT: Do not assume any method and DO NOT infer if it is location based or market based based on energy use or other information, just use their explicit method statement to decide if you put values in the field for lb (location-based), mb (market-based), both or unknown. 
    - CRITICAL RULE: If the document states they use a methodology IN GENERAL (e.g., "we use market-based approach"), then ALL scope 2 values in that document are classified with that method. You do NOT need individual values to be labeled - the general statement applies to everything.
    - ONLY use "unknown" if NO methodology is mentioned ANYWHERE in the document.  - ALWAYS PUT THE VALUES IN THE UNKNOWN FIELD IF NO METHOD IS MENTIONED: "No method is mentioned, so the values are put in the unknown field."
    
    - FORBIDDEN REASONING: Never say "specific value is not labeled" or "value not explicitly stated as market-based" - this reasoning is incorrect and forbidden.
    
    
      - Fill in explanationOfWhyYouPutValuesToMbOrLbOrUnknown with a short explanation of why you put the values in the field for mb (market-based), lb (location-based) or unknown. Then put the values in the corresponding field.
    
      IMPORTANT: 
      1. First: fill in mentionOfLocationBasedOrMarketBased, try to find a quote from the document. Make sure to include both methods if both are stated!
      2. Second: Use that to create an explanation for explanationOfWhyYouPutValuesToMbOrLbOrUnknown. IMPORTANT: A general method applies to all values so if they have mention using market-based, then all values are market-based. They do not have to state a method for each specific value.
      3. Third:Only after that you put the values in the corresponding field. 
    
      For any fiscal year notation (2015/16, FY16, etc.), always use the ENDING year (2016) in your output.
    
      NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.
      
    
    
      *** Example***
      //   This is only an example format; do not include this specific data in the output and do not use markdown in the output:
    
      // Case 1: Method explicitly stated
      {
        "scope12": [{
          "year": 2023,
          "scope1": { "total": 12.3, "unit": "tCO2e" },
          "scope2": { "mb": 23.4, "lb": null, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": "We use market-based methodology", "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field." }
        }]
      }
   
   
      
      // Case 2: Method NOT specified - use unknown
      {
        "scope12": [{
          "year": 2023,
          "scope1": { "total": 12.3, "unit": "tCO2e" },
          "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": null, "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No method is mentioned, so the values are put in the unknown field." } // if there is no method ALWAYS put to unknown, never anywhere else.
        }]
      }
   
        // Case 3: Both methods are stated
      {
        "scope12": [{
          "year": 2023,
          "scope1": { "total": 12.3  , "unit": "tCO2e" },
          "scope2": { "mb": 23.4, "lb": 34.5, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": "We use market-based methodology and location-based methodology", "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use both market-based and location-based methodology. That means some values are market-based and added to the mb field and others are location-based and added to the lb field." }
        }]
      }
      `


  export const lantmannenTestCombined = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
    Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
  If you have found a value for scope 2, you must do this:
  - Check if they mention anywhere that they use a market based or location based method.
  
  Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.
  
  
  **Units**:
  - Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
  - All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
  - Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
  - If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
  - If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
  - All values must be converted to metric tons if they are provided in other units:
    - Example: 
      - 1000 CO2e → 1 tCO2e
      - 1000 CO2 → 1 tCO2
      - 1 kton CO2e → 1000 tCO2e
      - 1 Mton CO2 → 1,000,000 tCO2
  - Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

  Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons




  
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
  
  
  export const marketBasedStressPrompt = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
  Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
  If you have found a value for scope 2, you must do this:
  - Scan the text and footnotes to see if they say that the calculation / allocation method / etc. is market based or location based.
  - If they indicate having used a market based method, set the value to market based.
  - If they indicate having used a location based method, set the value to location based.
  - If they don't say anything, set the value to unknown. If you can't find any information about market based or location based, set the value to unknown.
  - If you can't find any information about market based or location based, set the value to unknown.
  
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
  - If you get some variation of the unit in metric tons, CO2e, CO2, or tCO2e, tCO2, tCO2e, use the wording **tCO2e** (with the "e" suffix).

  
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
  


  export const marketBasedShortVersionPrompt = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
  Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
  If you have found a value for scope 2, you must do this:
  - Check if they mention anywhere that they use a market based or location based method.
  
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
  - If you get some variation of the unit in metric tons, CO2e, CO2, or tCO2e, tCO2, tCO2e, use the wording **tCO2e** (with the "e" suffix).

  
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
  



  export const byggmaxImprovements = `
  *** Golden Rule ***
  - Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
  
  Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
  If you have found a value for scope 2, you must do this:
  - Check if they mention anywhere that they use a market based or location based method.

  Answer yes or no, did they mention anywhere that they use a market based or location based method?
  [yes/no]
  
  If yes: Include market-based (mb) and location-based (lb) in scope 2. If you can't find both, include the one you can find and set the other to null.
  If no: Set the value in the unknown category and set mb and lb to null.
  
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
  - If you get some variation of the unit in metric tons, CO2e, CO2, or tCO2e, tCO2, tCO2e, use the wording **tCO2e** (with the "e" suffix).

  
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
        "unknown": null, //null if we can categorize the value as mb or lb
        "unit": "tCO2e"
      }
    }]
  }
  `




  // current "best"
export const secondprompt = `
*** Golden Rule ***
- Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.

- First of all, find out which is the most recent year they specify scope emissions for. Put that year in the field absoluteMostRecentYearInReport.

Extract absolute scope 1 and 2 emissions according to the GHG protocol (CO2e) for all years in the report, starting from the most recent one. Do NOT extract emission intensity values and NOT values that are ton/something like ton/area, just absolute values in tons. 
Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.

**Units**:
- Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
- All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
- Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
- If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
- If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
- All values must be converted to metric tons if they are provided in other units:
  - Example: 
    - 1000 CO2e → 1 tCO2e
    - 1000 CO2 → 1 tCO2
    - 1 kton CO2e → 1000 tCO2e
    - 1 Mton CO2 → 1,000,000 tCO2
- Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons


- If there is any mention of location based or market based anywhere in the document (tables, footnotes, text), add the quote from the document in mentionOfLocationBasedOrMarketBased.

- EXTREMELY IMPORTANT: Do not assume any methods and DO NOT infer if a number is location based or market based based on energy use or other information, just use their explicit method statement to decide which values to put in the field for lb (location-based), mb (market-based), both or unknown. 
- ONLY use "unknown" if NO methodology is mentioned ANYWHERE in the document.  - ALWAYS PUT THE VALUES IN THE UNKNOWN FIELD IF NO METHOD IS MENTIONED: "No method is mentioned, so the values are put in the unknown field."

- FORBIDDEN REASONING: Never say "specific value is not labeled" or "value not explicitly stated as market-based" - this reasoning is incorrect and forbidden.


- Fill in explanationOfWhyYouPutValuesToMbOrLbOrUnknown with a short explanation of why you put the values in the field for mb (market-based), lb (location-based), both mb and lb or unknown. Base this on all mentions in mentionOfLocationBasedOrMarketBased! Then put the values in the corresponding field.

IMPORTANT: 
1. First: LOOK CAREFULLY and find ALL mentions of market based and location based methods in the table headers, table rows, footnotes and text and add ALL OF THEM (words or phrases) to the array mentionOfLocationBasedOrMarketBased. Make sure to include both market based and location based if both are stated! Remember to look in the table rows where the methods can also can be mentioned directly next to the values!
2. Second: Use those mentions to create an explanation for explanationOfWhyYouPutValuesToMbOrLbOrUnknown. 
3. Third:Only after that you put the values in the corresponding field or fields. 

For any fiscal year notation (2015/16, FY16, etc.), always use the ENDING year (2016) in your output.

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.



*** Example***
//   This is only an example format; do not include this specific data in the output and do not use markdown in the output:

// Case 1: Method explicitly stated
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3, "unit": "tCO2e" },
    "scope2": { "mb": 23.4, "lb": null, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field." }
  }]
}



// Case 2: Method NOT specified - use unknown
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3, "unit": "tCO2e" },
    "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": null, "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No method is mentioned, so the values are put in the unknown field." } // if there is no method ALWAYS put to unknown, never anywhere else.
  }]
}

  // Case 3: Both methods are stated
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3  , "unit": "tCO2e" },
    "scope2": { "mb": 23.4, "lb": 34.5, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology", "We use location-based methodology", "Market-based emissions", "Location-based emissions"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use both market-based and location-based methodology. That means some values are market-based and added to the mb field and others are location-based and added to the lb field." }
  }]
}

// Case 4: No data for any year
{
 "scope12": []
}
`


export const prompt = `
*** Golden Rule ***
- Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.

- First of all, find out which is the most recent year they specify scope emissions for. Put that year in the field absoluteMostRecentYearInReport. The years and emissions can be specified in a table header, in a retrospective column, or in text.

Extract absolute (in tonnes only) scope 1 and 2 emissions that are specified in tonnes CO2 or CO2e according to the GHG protocol (CO2e) for all years in the report, starting from the most recent one. 
The values need to be in tonnes only, or a simple multiple of tonnes. Do NOT extract emission intensity values and NOT values that are ton/something like ton/area, just absolute values in tons. 
Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.

**Units**:
- Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
- All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
- Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
- If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
- If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
- All values must be converted to metric tons if they are provided in other units:
  - Example: 
    - 1000 CO2e → 1 tCO2e
    - 1000 CO2 → 1 tCO2
    - 1 kton CO2e → 1000 tCO2e
    - 1 Mton CO2 → 1,000,000 tCO2
    - 1 CO2/area -> IMPORTANT! DO NOT INCLUDE THIS IN THE OUTPUT, not pure tonnes
    - 1 CO2e/revenue / intensity -> IMPORTANT! DO NOT INCLUDE THIS IN THE OUTPUT, not pure tonnes
- Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons


- If there is any mention of location based or market based anywhere in the document (tables, footnotes, text), add the quote from the document in mentionOfLocationBasedOrMarketBased.

- EXTREMELY IMPORTANT: Do not assume any methods and DO NOT infer if a number is location based or market based based on energy use or other information, just use their explicit method statement to decide which values to put in the field for lb (location-based), mb (market-based), both or unknown. 
- ONLY use "unknown" if NO methodology is mentioned ANYWHERE in the document.  - ALWAYS PUT THE VALUES IN THE UNKNOWN FIELD IF NO METHOD IS MENTIONED: "No method is mentioned, so the values are put in the unknown field."

- FORBIDDEN REASONING: Never say "specific value is not labeled" or "value not explicitly stated as market-based" - this reasoning is incorrect and forbidden.


- Fill in explanationOfWhyYouPutValuesToMbOrLbOrUnknown with a short explanation of why you put the values in the field for mb (market-based), lb (location-based), both mb and lb or unknown. Base this on all mentions in mentionOfLocationBasedOrMarketBased! Then put the values in the corresponding field.
- Put all values in the listOfAllAvailableNumbersAndTheirMethods. If there are duplicate values for mb or lb, add them all to the list but for choosing a value, prefer the ones that are from the same table or page.

IMPORTANT: 
1. First: LOOK CAREFULLY and find ALL mentions of market based and location based methods in the table headers, table rows, footnotes and text and add ALL OF THEM (words or phrases) to the array mentionOfLocationBasedOrMarketBased. Make sure to include both market based and location based if both are stated! Remember to look in the table rows where the methods can also can be mentioned directly next to the values!
2. Second: Use those mentions to create an explanation for explanationOfWhyYouPutValuesToMbOrLbOrUnknown. 
3. Third:Only after that you put the values in the corresponding field or fields. 

For any fiscal year notation (2015/16, FY16, etc.), always use the ENDING year (2016) in your output.

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.



*** Example***
//   This is only an example format; do not include this specific data in the output and do not use markdown in the output:

// Case 1: Method explicitly stated
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3, "unit": "tCO2e" },
    "scope2": { "mb": 23.4, "lb": null, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field." }
  }]
}



// Case 2: Method NOT specified - use unknown
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3, "unit": "tCO2e" },
    "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": null, "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No method is mentioned, so the values are put in the unknown field." } // if there is no method ALWAYS put to unknown, never anywhere else.
  }]
}

  // Case 3: Both methods are stated
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3  , "unit": "tCO2e" },
    "scope2": { "mb": 23.4, "lb": 34.5, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology", "We use location-based methodology", "Market-based emissions", "Location-based emissions"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use both market-based and location-based methodology. That means some values are market-based and added to the mb field and others are location-based and added to the lb field." }
  }]
}

// Case 4: No data for any year
{
 "scope12": []
}
`