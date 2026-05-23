import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface ProductFilters {
  search?: string
  categoryId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const productService = {
  async list(filters: ProductFilters = {}) {
    const {
      search,
      categoryId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
        ],
      }),
      ...(categoryId && { categoryId }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ])

    // Convert Decimal types to numbers for proper JSON serialization
    const serializedProducts = products.map(product => ({
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
    }))

    return {
      products: serializedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!product) return null

    // Convert Decimal types to numbers for proper JSON serialization
    return {
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
    }
  },

  async create(data: {
    name: string
    sku: string
    barcode?: string
    categoryId: string
    unitType: string
    costPrice: number
    sellingPrice: number
    currentStock: number
    minStockAlert?: number
    notes?: string
  }) {
    // Check SKU uniqueness
    const exists = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (exists) {
      throw new Error('A product with this SKU already exists')
    }

    return prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || null,
        categoryId: data.categoryId,
        unitType: data.unitType,
        costPrice: new Prisma.Decimal(data.costPrice),
        sellingPrice: new Prisma.Decimal(data.sellingPrice),
        currentStock: data.currentStock,
        minStockAlert: data.minStockAlert ?? 5,
        notes: data.notes || null,
      },
      include: { category: true },
    })
  },

  async update(id: string, data: Partial<{
    name: string
    sku: string
    barcode: string | null
    categoryId: string
    unitType: string
    costPrice: number
    sellingPrice: number
    minStockAlert: number
    notes: string | null
  }>) {
    // If SKU is being changed, check uniqueness
    if (data.sku) {
      const exists = await prisma.product.findFirst({
        where: { sku: data.sku, id: { not: id } },
      })
      if (exists) {
        throw new Error('A product with this SKU already exists')
      }
    }

    const updateData: Prisma.ProductUpdateInput = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.barcode !== undefined) updateData.barcode = data.barcode
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } }
    if (data.unitType !== undefined) updateData.unitType = data.unitType
    if (data.costPrice !== undefined) updateData.costPrice = new Prisma.Decimal(data.costPrice)
    if (data.sellingPrice !== undefined) updateData.sellingPrice = new Prisma.Decimal(data.sellingPrice)
    if (data.minStockAlert !== undefined) updateData.minStockAlert = data.minStockAlert
    if (data.notes !== undefined) updateData.notes = data.notes

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })
  },

  async delete(id: string) {
    // Soft delete
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    })
  },

  async search(query: string, limit = 10) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { barcode: { contains: query } },
        ],
      },
      include: { category: true },
      take: limit,
    })

    // Convert Decimal types to numbers for proper JSON serialization
    return products.map(product => ({
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
    }))
  },

  async getLowStock() {
    return prisma.product.findMany({
      where: {
        isActive: true,
        currentStock: {
          lte: prisma.product.fields.minStockAlert as unknown as number,
        },
      },
      include: { category: true },
      orderBy: { currentStock: 'asc' },
    })
  },

  async bulkCreate(products: Array<{
    name: string
    sku: string
    barcode?: string
    categoryId: string
    unitType: string
    costPrice: number
    sellingPrice: number
    currentStock: number
    minStockAlert?: number
    notes?: string
  }>) {
    const results: { success: number; errors: Array<{ row: number; error: string }> } = {
      success: 0,
      errors: [],
    }

    for (let i = 0; i < products.length; i++) {
      try {
        await this.create(products[i])
        results.success++
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  },
}
