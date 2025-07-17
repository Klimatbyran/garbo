// Expected results for different test cases
// Each test file can map to a specific expected result

export const expectedResults = {
  // Default result for most test files
  default: {
    "scope12": [
      {
        "year": 2024,
        "scope1": {
          "total": 61657,
          "unit": "tCO2"
        },
        "scope2": {
          "mb": 7828,
          "lb": null,
          "unknown": null,
          "unit": "tCO2"
        }
      },
      {
        "year": 2023,
        "scope1": {
          "total": 54361,
          "unit": "tCO2"
        },
        "scope2": {
          "mb": 19431,
          "lb": null,
          "unknown": null,
          "unit": "tCO2"
        }
      },
      {
        "year": 2022,
        "scope1": {
          "total": 58543,
          "unit": "tCO2"
        },
        "scope2": {
          "mb": 35618,
          "lb": null,
          "unknown": null,
          "unit": "tCO2"
        }
      }
    ]
  },

  // Example: Different expected result for a specific test case
  "company_with_location_based": {
    "scope12": [
      {
        "year": 2024,
        "scope1": {
          "total": 45000,
          "unit": "tCO2"
        },
        "scope2": {
          "mb": null,
          "lb": 8500,
          "unknown": null,
          "unit": "tCO2"
        }
      }
    ]
  },

  // Example: Test case with missing scope1 data
  "missing_scope1": {
    "scope12": [
      {
        "year": 2024,
        "scope1": null,
        "scope2": {
          "mb": 7828,
          "lb": null,
          "unknown": null,
          "unit": "tCO2"
        }
      }
    ]
  }
};

// Mapping from test file names to expected results
// If not specified, uses 'default'
export const testFileMapping = {
  "markdown": "default",
  "company_report_2024": "company_with_location_based",
  "sustainability_report": "missing_scope1"
  // Add more mappings as needed
};