export const reportMappings = {
    report: {
      type: 'nested',
      properties: {
        "companyName": { "type": "keyword" },
        "bransch": { "type": "keyword" },
        "baseYear": { "type": "keyword" },
        "url": { "type": "keyword" },
        "emissionsData": {
          "type": "nested",
          "properties": {
            "year": { "type": "keyword" },
            "scope1": {
              "properties": {
                "emissions": { "type": "double" },
                "unit": { "type": "keyword" }
              }
            },
            "scope2": {
              "properties": {
                "emissions": { "type": "double" },
                "unit": { "type": "keyword" },
                "mb": { "type": "double" },
                "lb": { "type": "double" }
              }
            },
            "scope3": {
              "properties": {
                "emissions": { "type": "double" },
                "unit": { "type": "keyword" },
                "categories": {
                  "type": "nested",
                  "properties": {
                    "categoryName": { "type": "keyword" },
                    "emissions": { "type": "double" }
                  }
                }
              }
            },
            "totalEmissions": { "type": "double" },
            "totalUnit": { "type": "keyword" },
            "reliability": { "type": "keyword" },
            "needsReview": { "type": "boolean" },
            "reviewComment": { "type": "text" },
            "reviewStatusCode": { "type": "keyword" }
          }
        }
      }
    }
  };
  