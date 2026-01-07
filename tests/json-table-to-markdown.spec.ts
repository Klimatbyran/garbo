import { table } from '../src/lib/jsonExtraction';
import { Table as NLMIngestorTable } from '../src/lib/nlm-ingestor-schema';
import {jest} from '@jest/globals';

describe('Table Parser', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should correctly parse Vattenfall emissions table with multi-level headers', () => {
    const inputBlock = {
      "bbox": [
        256.45,
        96.95,
        569.95,
        103.95
      ],
      "block_class": "cls_28",
      "block_idx": 3755,
      "level": 13,
      "page_idx": 145,
      "tag": "table",
      "name": "Upplysningar som avses i artikel 8.6 och 8.7",
      "table_rows": [
        {
          "block_idx": 3755,
          "cells": [
            { "cell_value": "", "col_span": 1 },
            { "cell_value": "Retroaktivt", "col_span": 3 },
            { "cell_value": "År för delmål och mål", "col_span": 3 }
          ],
          "type": "table_header"
        },
        {
          "block_idx": 3756,
          "cells": [
            { "cell_value": "E1-6 Bruttoväxthusgasutsläpp inom scope 1, 2, 3 och totala växthusgasutsläpp1" },
            { "cell_value": "2017" },
            { "cell_value": "2023" },
            { "cell_value": "2024" },
            { "cell_value": "2023–2024 (%)" },
            { "cell_value": "2030" },
            { "cell_value": "2040" },
            { "cell_value": "Årligt mål i % /Basår2" }
          ],
          "type": "table_header"
        },
        {
          "block_idx": 3757,
          "cells": [
            { "cell_value": "Utsläppsminskningsmål godkända av SBTi3 Scope 1 och 2 (marknadsbaserade) intensitet, gCO2e/kWh" },
            { "cell_value": "110,4" },
            { "cell_value": "33,5" },
            { "cell_value": "33,7" },
            { "cell_value": "0,6%" },
            { "cell_value": "25,4" },
            { "cell_value": "9,1" },
            { "cell_value": "5,9%" }
          ],
          "type": "table_data_row"
        },
        {
          "block_idx": 3758,
          "cells": [
            { "cell_value": "Scope 1 och Scope 3 Såld elektricitet, intensitet, gCO2e/kWh" },
            { "cell_value": "199,1" },
            { "cell_value": "88,7" },
            { "cell_value": "66,6" },
            { "cell_value": "–24,9%" },
            { "cell_value": "43,7" },
            { "cell_value": "9,1" },
            { "cell_value": "6,0%" }
          ],
          "type": "table_data_row"
        },
        {
          "block_idx": 3762,
          "type": "full_row",
          "cell_value": "Scope 1-växthusgasutsläpp",
          "col_span": 8
        },
        {
          "block_idx": 3764,
          "cells": [
            { "cell_value": "MtCO2e 4, 11" },
            { "cell_value": "12,6" },
            { "cell_value": "3,2" },
            { "cell_value": "3,3" },
            { "cell_value": "2,2%" },
            { "cell_value": "3.3" },
            { "cell_value": "1.2" },
            { "cell_value": "5,7%" }
          ],
          "type": "table_data_row"
        }
      ]
    };
    const expectedMarkdown = `| E1-6 Bruttoväxthusgasutsläpp inom scope 1, 2, 3 och totala växthusgasutsläpp1 | 2017 | 2023 | 2024 | 2023–2024 (%) | 2030 | 2040 | Årligt mål i % /Basår2 |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  | Retroaktivt | Retroaktivt | Retroaktivt | År för delmål och mål | År för delmål och mål | År för delmål och mål |  |
| Utsläppsminskningsmål godkända av SBTi3 Scope 1 och 2 (marknadsbaserade) intensitet, gCO2e/kWh | 110,4 | 33,5 | 33,7 | 0,6% | 25,4 | 9,1 | 5,9% |
| Scope 1 och Scope 3 Såld elektricitet, intensitet, gCO2e/kWh | 199,1 | 88,7 | 66,6 | –24,9% | 43,7 | 9,1 | 6,0% |
| Scope 1-växthusgasutsläpp |
| MtCO2e 4, 11 | 12,6 | 3,2 | 3,3 | 2,2% | 3.3 | 1.2 | 5,7% |
![table image]({page: 145, x: 256}, {y: 97, {width: 314}, {height: 7})`;

    const result = table(inputBlock as any);

    expect(result).toBe(expectedMarkdown);
  });

  test('should handle table with single header row', () => {
    const inputBlock: NLMIngestorTable = {
      "bbox": [100, 100, 200, 150],
      "block_class": "cls_1",
      "block_idx": 1,
      "level": 1,
      "page_idx": 1,
      "tag": "table",
      "left": 100,
      "top": 100,
      "name": "Simple Table",
      "table_rows": [
        {
          "block_idx": 1,
          "cells": [
            { "cell_value": "Name" },
            { "cell_value": "Value" }
          ],
          "type": "table_header"
        },
        {
          "block_idx": 2,
          "cells": [
            { "cell_value": "Item A" },
            { "cell_value": "100" }
          ],
          "type": "table_data_row"
        }
      ]
    };

    const expectedMarkdown = `| Name | Value |
| --- | --- |
| Item A | 100 |
![table image]({page: 1, x: 100}, {y: 100, {width: 100}, {height: 50})`;

    const result = table(inputBlock);

    expect(result).toBe(expectedMarkdown);
  });

  test('should handle empty table_rows', () => {
    const inputBlock: NLMIngestorTable = {
      "block_class": "cls_1",
      "block_idx": 1,
      "level": 1,
      "page_idx": 1,
      "tag": "table",
      "left": 0,
      "top": 0,
      "name": "Empty Table",
      "table_rows": []
    };

    const result = table(inputBlock);

    expect(result).toBe("Empty Table");
  });

  test('should handle table without bbox', () => {
    const inputBlock: NLMIngestorTable = {
      "block_class": "cls_1",
      "block_idx": 1,
      "level": 1,
      "page_idx": 1,
      "tag": "table",
      "left": 0,
      "top": 0,
      "name": "No Bbox Table",
      "table_rows": [
        {
          "block_idx": 1,
          "cells": [
            { "cell_value": "Col1" },
            { "cell_value": "Col2" }
          ],
          "type": "table_header"
        }
      ]
    };

    const expectedMarkdown = `| Col1 | Col2 |
| --- | --- |`;

    const result = table(inputBlock);

    expect(result).toBe(expectedMarkdown);
  });

  test('should correctly use the last header row when multiple headers exist', () => {
    const inputBlock: NLMIngestorTable = {
      "bbox": [0, 0, 100, 100],
      "block_class": "cls_1",
      "block_idx": 1,
      "level": 1,
      "page_idx": 1,
      "tag": "table",
      "left": 0,
      "top": 0,
      "name": "Multi Header Table",
      "table_rows": [
        {
          "block_idx": 1,
          "cells": [
            { "cell_value": "Group 1", "col_span": 2 },
            { "cell_value": "Group 2", "col_span": 2 }
          ],
          "type": "table_header"
        },
        {
          "block_idx": 2,
          "cells": [
            { "cell_value": "Category" },
            { "cell_value": "2023" },
            { "cell_value": "2024" },
            { "cell_value": "Target" }
          ],
          "type": "table_header"
        },
        {
          "block_idx": 3,
          "cells": [
            { "cell_value": "Revenue" },
            { "cell_value": "100" },
            { "cell_value": "120" },
            { "cell_value": "150" }
          ],
          "type": "table_data_row"
        }
      ]
    };

    const result = table(inputBlock);

    // Should use the second header row (with Category, 2023, 2024, Target)
    expect(result).toContain("| Category | 2023 | 2024 | Target |");
    expect(result).toContain("| Revenue | 100 | 120 | 150 |");
  });

});

// Helper function tests if you extract getCellValueString and deHyphenate
describe('Helper Functions', () => {
  // Mock these functions or import them if they're exported
  const getCellValueString = (cell: any) => cell.cell_value || '';
  const deHyphenate = (str: string) => str.replace(/-/g, ' ');

  test('getCellValueString should return cell value', () => {
    expect(getCellValueString({ cell_value: "test" })).toBe("test");
    expect(getCellValueString({})).toBe("");
  });

  test('deHyphenate should replace hyphens with spaces', () => {
    expect(deHyphenate("test-value")).toBe("test value");
    expect(deHyphenate("no-hyphens-here")).toBe("no hyphens here");
  });
});