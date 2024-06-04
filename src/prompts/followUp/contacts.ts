const contacts = `
Extract the company sustainability contacts. Add it as field contacts:
Be as accurate as possible when extracting contacts. These values will be used to contact the company with the extract later on for manual approval.

Example (never keep any example data in your final response):
\`\`\`json
{ 
  "contacts": [
    { 
      "name": "John Doe",
      "role": "Sustainability Manager", 
      "email": "john@doe.se", 
      "phone": "123456789"
    }
  ]
}
\`\`\`
`

export default contacts
