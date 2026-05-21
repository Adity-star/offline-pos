import { prisma } from '@/lib/prisma'

export const categoryService = {
  async list() {
    return prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })
  },

  async create(data: { name: string; description?: string }) {
    const exists = await prisma.category.findUnique({ where: { name: data.name } })
    if (exists) {
      throw new Error('A category with this name already exists')
    }

    return prisma.category.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
    })
  },

  async update(id: string, data: { name?: string; description?: string | null }) {
    if (data.name) {
      const exists = await prisma.category.findFirst({
        where: { name: data.name, id: { not: id } },
      })
      if (exists) {
        throw new Error('A category with this name already exists')
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    })
  },

  async delete(id: string) {
    const productCount = await prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      throw new Error(`Cannot delete category with ${productCount} products`)
    }
    return prisma.category.delete({ where: { id } })
  },

  async getOrCreate(name: string) {
    let category = await prisma.category.findUnique({ where: { name } })
    if (!category) {
      category = await prisma.category.create({ data: { name } })
    }
    return category
  },
}
