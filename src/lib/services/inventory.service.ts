import { prisma } from '@/lib/prisma'
import { Prisma, InventoryActionType } from '@prisma/client'

export interface InventoryLogFilters {
  productId?: string
  actionType?: InventoryActionType
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const inventoryService = {
  async adjustStock(data: {
    productId: string
    userId: string
    quantity: number // positive = add, negative = remove
    reason: string
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      })
      if (!product) throw new Error('Product not found')

      const newStock = product.currentStock + data.quantity
      if (newStock < 0) {
        const settings = await tx.setting.findFirst()
        if (!settings?.allowNegativeStock) {
          throw new Error(
            `Cannot reduce stock below 0. Current: ${product.currentStock}, Adjustment: ${data.quantity}`
          )
        }
      }

      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: newStock },
      })

      const log = await tx.inventoryLog.create({
        data: {
          productId: data.productId,
          userId: data.userId,
          actionType: data.quantity > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
          previousStock: product.currentStock,
          changedQuantity: data.quantity,
          newStock,
          referenceType: 'MANUAL',
          reason: data.reason,
        },
        include: { product: true },
      })

      return { log, product: { ...product, currentStock: newStock } }
    })
  },

  async getLogs(filters: InventoryLogFilters = {}) {
    const {
      productId,
      actionType,
      dateFrom,
      dateTo,
      page = 1,
      limit = 30,
    } = filters

    const where: Prisma.InventoryLogWhereInput = {
      ...(productId && { productId }),
      ...(actionType && { actionType }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + 'T23:59:59') }),
            },
          }
        : {}),
    }

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        include: {
          product: true,
          user: { select: { fullName: true, username: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryLog.count({ where }),
    ])

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async getLowStockProducts() {
    // Use raw query to compare currentStock with minStockAlert
    const products = await prisma.$queryRaw<
      Array<{
        id: string
        name: string
        sku: string
        currentStock: number
        minStockAlert: number
        categoryId: string
      }>
    >`
      SELECT id, name, sku, currentStock, minStockAlert, categoryId
      FROM Product
      WHERE isActive = 1 AND currentStock <= minStockAlert
      ORDER BY currentStock ASC
    `

    return products
  },

  async getStockOverview() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    const totalProducts = products.length
    const totalStockValue = products.reduce(
      (sum, p) => sum + p.currentStock * Number(p.costPrice),
      0
    )
    const lowStockCount = products.filter(
      (p) => p.currentStock <= p.minStockAlert
    ).length
    const outOfStockCount = products.filter(
      (p) => p.currentStock <= 0
    ).length

    return {
      products,
      totalProducts,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
    }
  },
}
