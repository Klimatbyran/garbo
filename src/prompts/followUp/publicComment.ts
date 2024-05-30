const publicComment = `
Make a public comment on the company emissions and reporting quality. Be as accurate as possible and include a summary of most important information. This will be used to inform the public about the company emissions and their reporting. Just reply with the information you can find in json format.

*** Write in Swedish *** 

\`\`\`json
{
   "publicComment": "Företag X rapporterar utsläpp i Scope 3 från kategorierna Inköpta varor och tjänster (1), Bränsle- och energirelaterade aktiviteter (3), Uppströms transport och distribution (4), Avfall genererat i verksamheten (5), Affärsresor (6), Anställdas pendling (7), Nedströms transport och distribution (9), och Användning av sålda produkter (11). De har satt mål att nå netto nollutsläpp innan Y."
}
\`\`\`
`

export default publicComment
