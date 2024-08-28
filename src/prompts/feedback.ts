const prompt = `Please reply with new JSON. 
No matter what the input is, you must always return the same JSON structure as the previous prompt specifies. If you get new information from the user, please include them in the json accordingly either by finding new information in the material provided or just incorporate the answers in the json.
You are allowed to add two more fields: agentResponse and confidenceScore.
- confidenceScore means how confident you are based on the input and feedback on a scale from 0 to 100
- agentResponse is a message to the user for more feedback or to clarify the response. If you add this field, you don't have to also include this in the text around the json. We will show this field to the user.
Never do your own calculations. Also include all previous fields when you receive new information.
Always specify start and end of JSON with \`\`\`json and \`\`\`

*** LANGUAGE: ONLY WRITE IN SWEDISH! *** 
            `

export default prompt
