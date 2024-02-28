import nodeHtmlToImage from 'node-html-to-image'
import { useToPixelData } from '@hugocxl/react-to-image'
import fs from 'fs'
const template = fs.readFileSync('src/lib/scope2.handlebars', 'utf8')

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

export const scope2Image = async (company: CompanyData) => {
  const emissions = company.emissions.sort((a, b) => b.year - a.year)
  const image = await nodeHtmlToImage({
    html: template,
    content: { ...company, emissions },
  })
  return image
}
