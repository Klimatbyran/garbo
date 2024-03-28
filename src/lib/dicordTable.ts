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
  const url = fetch('http://localhost/')
  const image = await nodeHtmlToImage({
    html: template,
    content: { ...company, emissions },
  })
  return image
}
*/
export const scope2Table = async (company: CompanyData) => {
  const emissions = company.emissions.sort((a, b) => b.year - a.year)

  const table = [
    ['CO2', ...emissions.map((e) => e.year.toString())],
    ['Scope 1', ...emissions.map((e) => e.scope1?.emissions.toString() || '-')],
    ['Scope 2', ...emissions.map((e) => e.scope2?.emissions.toString() || '-')],
  ]

  return table.map((t) => t.join('\t')).join('\n')
}
