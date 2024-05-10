import { Table } from 'embed-table'
import { EmbedBuilder } from 'discord.js'
import { CompanyData } from '../models/companyEmissions'
import { compareFacitToCompanyData, findFacit } from './facit'

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

export const summaryTable = async (
  company: CompanyData,
  facit?: CompanyData
) => {
  if (!company.emissions) {
    return '*Ingen data rapporterad*'
  }

  const emissions = company.emissions
    ?.sort((a, b) => b.year - a.year)
    .slice(0, 3)

  if (!facit) facit = await findFacit(company.companyName).catch(() => null)
  const check = facit
    ? compareFacitToCompanyData(facit, company)
    : { scope1: null, scope2: null, scope3: null, summary: 'Facit hittades ej' }

  const table = [
    ['🎯', trimText('CO2e'), ...emissions.map((e) => trimText(e.year))],
    [
      check.scope1 ? '✅' : check.scope1 === false ? '❌' : '❓',
      trimText('Scope 1'),
      ...emissions.map((e) => trimText(e.scope1?.emissions) || trimText('-')),
    ],
    [
      check.scope2 ? '✅' : check.scope2 === false ? '❌' : '❓',
      trimText('Scope 2'),
      ...emissions.map((e) => trimText(e.scope2?.emissions) || trimText('-')),
    ],
    [
      check.scope3 ? '✅' : check.scope3 === false ? '❌' : '❓',
      trimText('Scope 3'),
      ...emissions.map((e) => trimText(e.scope3?.emissions) || trimText('-')),
    ],
    [check.summary || ''],
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
