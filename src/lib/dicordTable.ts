import { Table } from 'embed-table'
import { EmbedBuilder } from 'discord.js'

type YearEmissions = {
  year: number
  scope1: {
    emissions: string
    unit: string
    baseYear: string
  }
  scope2: {
    emissions: string
    unit: string
    mb: string
    lb: string
    baseYear: string
  }
  scope3: {
    emissions: string
    unit: string
    baseYear: string
    categories: {
      [key: string]: string
    }
  }
  totalEmissions?: string
  totalUnit?: string
}

type CompanyData = {
  companyName: string
  bransch?: string
  baseYear?: string
  url?: string
  emissions: Array<YearEmissions>
  reliability?: string
  needsReview?: boolean
  reviewComment?: string
  reviewStatusCode?: string
}
/*
export const scope2Image = async (company: CompanyData) => {
  const emissions = company.emissions.sort((a, b) => b.year - a.year)
  const template = fs.readFileSync('src/lib/scope2.handlebars', 'utf8')
  const image = await nodeHtmlToImage({
    html: template,
    content: { ...company, emissions },
  })
  return image
}*/

export const scope2Table = async (company: CompanyData) => {
  const emissions = company.emissions.sort((a, b) => b.year - a.year)

  const table = new Table({
    titles: [
      '## Koldioxidutsläpp (CO<sub>2</sub>e)',
      ...emissions.map((e) => e.year.toString()),
    ],
    titleIndexes: [0, 8, 16],
    columnIndexes: [0, 6, 14],
    start: '`',
    end: '`',
    padEnd: 3,
  })

  table.addRow([
    company.companyName,
    ...emissions.map((e) => e.year.toString()),
  ])
  table.addRow(['Scope 1', ...emissions.map((e) => e.scope1.emissions)])
  table.addRow(['Scope 2', ...emissions.map((e) => e.scope2.emissions)])

  const embed = new EmbedBuilder().setFields(table.toField())
  return embed
}
