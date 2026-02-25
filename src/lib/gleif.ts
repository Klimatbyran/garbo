//functions to work with the gleif api https://documenter.getpostman.com/view/7679680/SVYrrxuU?version=latest

interface GleifLEIItem {
  attributes: {
    lei: string
    entity: {
      legalName: {
        name: string
        language: string
      }
      legalForm: {
        id: string
        other: string[]
      }
    }
  }
}

export async function getLEINumbersFromGLEIF(
  companyName: string
): Promise<GleifLEIItem[]> {
  const response = await fetch(
    `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${companyName}&page[number]=1&page[size]=50`,
  )
  if (!response.ok) {
    console.log(`Error ${response.status}: ${response.statusText}`)
    return []
  }

  const data = await response.json()
  return data.data
}
