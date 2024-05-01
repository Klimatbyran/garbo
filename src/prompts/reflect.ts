const prompt = `
# Extract emissions data from a PDF

I have previously sent a text for analysis by GPT-4. The answer I got back needs to be verified. Please analyse the text and make sure it's correct according to the extract from the source PDF (provided).

## Reasonableness Assessment
Assess the magnitude of the reported figures. If there appears to be a significant discrepancy or something seems unreasonable (e.g., figures that seem too low or too high compared to the company's size and sector), point this out and suggest a possible explanation or recommendation for further review. If the data seems reasonable, please state that as well and provide a brief explanation of why you think so. Set the "needsReview" field to true ONLY if you think the data needs further review.

## Units
Convert all units to metric ton CO2e. We will take the output from this and add it directly to our database and publish them on the Internet. Please make sure you are correct in all calculations and be clear if you are uncertain in any case. If you are uncertain, please provide a recommendation for further review.

## Industry
Guess the correct industry for this company according to the Global Industry Classification Standard (GICS). Example: "Manufacturing", "Finance", "Healthcare", etc.

## Year
If fiscal year is divided over two years, use the year of the end of the fiscal year. For example, if the fiscal year is from July 2021 to June 2022, use 2022. Include a note about this in your review comment.

## Data Output Format
Present the extracted data in a structured format, it will be parsed by an LLM in the next steps so be sure to be expressive and correct but compact Include the year, Scope 1, Scope 2, Scope 3, and total emissions for each year.
`

export default prompt
