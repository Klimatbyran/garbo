import { prisma } from '../../lib/prisma'

class ReportTypeService {
  async findAll() {
    return prisma.reportType.findMany({
      orderBy: { slug: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.reportType.findUnique({
      where: { id },
    })
  }

  async findBySlug(slug: string) {
    return prisma.reportType.findUnique({
      where: { slug },
    })
  }

  async create(data: { slug: string; label?: string | null }) {
    return prisma.reportType.create({
      data: {
        slug: data.slug,
        label: data.label ?? null,
      },
    })
  }

  async update(id: string, data: { slug?: string; label?: string | null }) {
    const existing = await prisma.reportType.findUniqueOrThrow({
      where: { id },
    })

    const updates: { slug?: string; label?: string | null } = {}
    if (data.slug !== undefined) updates.slug = data.slug
    if (data.label !== undefined) updates.label = data.label

    if (data.slug !== undefined && data.slug !== existing.slug) {
      const slugTaken = await prisma.reportType.findUnique({
        where: { slug: data.slug },
      })
      if (slugTaken && slugTaken.id !== id) {
        throw new Error(`Report type with slug "${data.slug}" already exists`)
      }
    }

    return prisma.reportType.update({
      where: { id },
      data: updates,
    })
  }

  async delete(id: string) {
    await prisma.$transaction(async (tx) => {
      await tx.report.updateMany({
        where: { reportTypeId: id },
        data: { reportTypeId: null },
      })
      await tx.reportType.delete({
        where: { id },
      })
    })
  }

  async getAllSlugs(): Promise<string[]> {
    const options = await prisma.reportType.findMany({
      select: { slug: true },
      orderBy: { slug: 'asc' },
    })
    return options.map((o) => o.slug)
  }

  async assertValidReportTypeId(reportTypeId: string | null | undefined) {
    if (reportTypeId === undefined) return
    if (reportTypeId === null) return
    const found = await prisma.reportType.findUnique({
      where: { id: reportTypeId },
      select: { id: true },
    })
    if (!found) {
      throw new Error(`Invalid report type id: ${reportTypeId}`)
    }
  }
}

export const reportTypeService = new ReportTypeService()
