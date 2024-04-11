import { Table } from 'embed-table'
import { EmbedBuilder } from 'discord.js'
import { CompanyData } from '../models/companyEmissions'

/*
export const scope2Image = async (company: CompanyData) => {
  const emissions = company.emissions.sort((a, b) => b.year - a.year)
  const template = fs.readFileSync('src/lib/scope2.handlebars', 'utf8')
  const url = fetch('http://localhost/')
  const image = await nodeHtmlToImage({
    html: template,
    content: { ...company, emissions },
  })
  return image
}
*/

const trimText = (text: string | number = '', length: number = 12) =>
  text && text.toLocaleString('sv-se').slice(0, length).padEnd(length, ' ')

export const summaryTable = async (company: CompanyData) => {
  if (!company.emissions) {
    return '*Ingen data rapporterad*'
  }

  const emissions = company.emissions?.sort((a, b) => b.year - a.year)

  const table = [
    [trimText('CO2'), ...emissions.map((e) => trimText(e.year))],
    [
      trimText('Scope 1'),
      ...emissions.map((e) => trimText(e.scope1?.emissions) || trimText('-')),
    ],
    [
      trimText('Scope 2'),
      ...emissions.map((e) => trimText(e.scope2?.emissions) || trimText('-')),
    ],
    [
      trimText('Scope 3'),
      ...emissions.map((e) => trimText(e.scope3?.emissions) || trimText('-')),
    ],
  ]

  return table.map((t) => t.join(' ')).join('\n')
}

export const scope3Table = async (company: CompanyData) => {
  if (!company.emissions) {
    return '*Ingen data rapporterad*'
  }

  const emissions = company.emissions?.sort((a, b) => b.year - a.year)
  const categories = [
    ...new Set(
      emissions.map((e) => Object.keys(e.scope3?.categories || {})).flat()
    ),
  ]

  if (!categories.length) {
    return '*Ingen Scope 3 data rapporterad*'
  }
  const table = [
    ...categories.map((c) => [
      trimText(c),
      ...emissions.map(
        (e) => trimText((e.scope3?.categories || {})[c]) || trimText('-')
      ),
    ]),
  ]
  return table.map((t) => t.join(' ')).join('\n')
}
