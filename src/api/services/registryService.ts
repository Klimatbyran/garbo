import { prisma } from '../../lib/prisma'

class RegistryService {
  async getReportRegistry() {
    const registry = await prisma.report.findMany({
      orderBy: [{ reportYear: 'desc' }, { companyName: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        companyName: true,
        wikidataId: true,
        reportYear: true,
        url: true,
      },
    })
    return registry
  }
}

export const registryService = new RegistryService()
