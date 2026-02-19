import { prisma } from '../../lib/prisma'

class TagOptionService {
  async findAll() {
    return prisma.tagOption.findMany({
      orderBy: { slug: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.tagOption.findUnique({
      where: { id },
    })
  }

  async findBySlug(slug: string) {
    return prisma.tagOption.findUnique({
      where: { slug },
    })
  }

  async create(data: { slug: string; label?: string | null }) {
    return prisma.tagOption.create({
      data: {
        slug: data.slug,
        label: data.label ?? null,
      },
    })
  }

  async update(
    id: string,
    data: { slug?: string; label?: string | null }
  ) {
    const existing = await prisma.tagOption.findUniqueOrThrow({
      where: { id },
    })

    const updates: { slug?: string; label?: string | null } = {}
    if (data.slug !== undefined) updates.slug = data.slug
    if (data.label !== undefined) updates.label = data.label

    if (data.slug !== undefined && data.slug !== existing.slug) {
      const oldSlug = existing.slug
      const newSlug = data.slug
      await prisma.$transaction(async (tx) => {
        const companies = await tx.company.findMany({
          where: { tags: { has: oldSlug } },
          select: { wikidataId: true, tags: true },
        })
        for (const company of companies) {
          const newTags = company.tags.map((t) => (t === oldSlug ? newSlug : t))
          await tx.company.update({
            where: { wikidataId: company.wikidataId },
            data: { tags: newTags },
          })
        }
        await tx.tagOption.update({
          where: { id },
          data: updates,
        })
      })
      return prisma.tagOption.findUniqueOrThrow({ where: { id } })
    }

    return prisma.tagOption.update({
      where: { id },
      data: updates,
    })
  }

  async delete(id: string) {
    const option = await prisma.tagOption.findUniqueOrThrow({
      where: { id },
    })
    const slug = option.slug

    await prisma.$transaction(async (tx) => {
      const companies = await tx.company.findMany({
        where: { tags: { has: slug } },
        select: { wikidataId: true, tags: true },
      })
      for (const company of companies) {
        const newTags = company.tags.filter((t) => t !== slug)
        await tx.company.update({
          where: { wikidataId: company.wikidataId },
          data: { tags: newTags },
        })
      }
      await tx.tagOption.delete({
        where: { id },
      })
    })
  }

  /** Returns all valid slugs (for validation). */
  async getAllSlugs(): Promise<string[]> {
    const options = await prisma.tagOption.findMany({
      select: { slug: true },
      orderBy: { slug: 'asc' },
    })
    return options.map((o) => o.slug)
  }
}

export const tagOptionService = new TagOptionService()
