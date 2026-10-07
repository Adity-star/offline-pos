import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { InventoryActionTypes } from '@/types/enums'

export interface CreatePurchaseItemInput {
  productId: string
  quantity: number
  unitCost: number
}

export interface CreatePurchaseInput {
  supplierId?: string
  supplierName: string
  invoiceNumber?: string
  userId: string
  items: CreatePurchaseItemInput[]
  discountAmount?: number
  taxAmount?: number
  paymentMode?: string
  paidAmount: number
  notes?: string
}

export interface PurchaseFilters {
  search?: string
  supplierId?: string
  paymentStatus?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const purchaseService = {
  async create(data: CreatePurchaseInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch all products to validate and get current details
      const productIds = data.items.map((i) => i.productId)
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      })

      const productMap = new Map(products.map((p) => [p.id, p]))

      for (const item of data.items) {
        if (!productMap.has(item.productId)) {
          throw new Error(`Product not found: ${item.productId}`)
        }
        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity for product ${item.productId}`)
        }
      }

      // 2. Generate unique Purchase Number
      const purchaseCount = await tx.purchase.count()
      const purchaseNumber = `PUR-${(purchaseCount + 1).toString().padStart(6, '0')}`

      // 3. Calculate financial details
      let subtotal = 0
      const purchaseItemsData = data.items.map((item) => {
        const prod = productMap.get(item.productId)!
        const totalCost = item.quantity * item.unitCost
        subtotal += totalCost
        return {
          productId: item.productId,
          productName: prod.name,
          sku: prod.sku,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost,
        }
      })

      const discountAmount = data.discountAmount || 0
      const taxAmount = data.taxAmount || 0
      const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount)
      const paidAmount = Math.min(grandTotal, Math.max(0, data.paidAmount))
      const dueAmount = grandTotal - paidAmount

      let paymentStatus = 'PAID'
      if (paidAmount === 0 && grandTotal > 0) {
        paymentStatus = 'UNPAID'
      } else if (dueAmount > 0) {
        paymentStatus = 'PARTIAL'
      }

      // 4. Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: data.supplierId || null,
          supplierName: data.supplierName,
          userId: data.userId,
          subtotal,
          discountAmount,
          taxAmount,
          grandTotal,
          paidAmount,
          dueAmount,
          paymentMode: data.paymentMode || 'CASH',
          paymentStatus,
          invoiceNumber: data.invoiceNumber || null,
          notes: data.notes || null,
          purchaseItems: {
            create: purchaseItemsData,
          },
        },
        include: {
          purchaseItems: true,
          supplier: true,
        },
      })

      // 5. Update stock, cost price, and create Inventory Logs
      for (const item of data.items) {
        const prod = productMap.get(item.productId)!
        const previousStock = prod.currentStock
        const newStock = previousStock + item.quantity

        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: newStock,
            costPrice: item.unitCost, // Update latest purchase cost price
          },
        })

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            userId: data.userId,
            actionType: InventoryActionTypes.RESTOCK,
            previousStock,
            changedQuantity: item.quantity,
            newStock,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
            reason: `Purchased from ${data.supplierName} (Bill #${data.invoiceNumber || purchaseNumber})`,
          },
        })
      }

      // 6. Handle Supplier Balance & Payment Log if supplier is registered
      if (data.supplierId) {
        if (dueAmount > 0) {
          const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } })
          if (supplier) {
            await tx.supplier.update({
              where: { id: data.supplierId },
              data: {
                pendingAmount: Number(supplier.pendingAmount) + dueAmount,
              },
            })
          }
        }

        if (paidAmount > 0) {
          await tx.supplierPayment.create({
            data: {
              supplierId: data.supplierId,
              purchaseId: purchase.id,
              amount: paidAmount,
              paymentMode: data.paymentMode || 'CASH',
              notes: `Paid towards Purchase ${purchaseNumber}`,
            },
          })
        }
      }

      return {
        ...purchase,
        subtotal: Number(purchase.subtotal),
        discountAmount: Number(purchase.discountAmount),
        taxAmount: Number(purchase.taxAmount),
        grandTotal: Number(purchase.grandTotal),
        paidAmount: Number(purchase.paidAmount),
        dueAmount: Number(purchase.dueAmount),
      }
    })
  },

  async getAll(filters: PurchaseFilters = {}) {
    const {
      search,
      supplierId,
      paymentStatus,
      dateFrom,
      dateTo,
      page = 1,
      limit = 30,
    } = filters

    const where: Prisma.PurchaseWhereInput = {
      isDeleted: false,
      ...(supplierId && { supplierId }),
      ...(paymentStatus && { paymentStatus }),
      ...(search && {
        OR: [
          { purchaseNumber: { contains: search } },
          { supplierName: { contains: search } },
          { invoiceNumber: { contains: search } },
        ],
      }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(`${dateTo}T23:59:59`) }),
            },
          }
        : {}),
    }

    const [purchases, total, summary] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, mobile: true } },
          user: { select: { id: true, fullName: true, username: true } },
          purchaseItems: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchase.count({ where }),
      prisma.purchase.aggregate({
        where: { isDeleted: false },
        _sum: {
          grandTotal: true,
          paidAmount: true,
          dueAmount: true,
        },
      }),
    ])

    return {
      purchases: purchases.map((p) => ({
        ...p,
        subtotal: Number(p.subtotal),
        discountAmount: Number(p.discountAmount),
        taxAmount: Number(p.taxAmount),
        grandTotal: Number(p.grandTotal),
        paidAmount: Number(p.paidAmount),
        dueAmount: Number(p.dueAmount),
        purchaseItems: p.purchaseItems.map((item) => ({
          ...item,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
        })),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalPurchases: Number(summary._sum.grandTotal ?? 0),
        totalPaid: Number(summary._sum.paidAmount ?? 0),
        totalDue: Number(summary._sum.dueAmount ?? 0),
      },
    }
  },

  async getById(id: string) {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: { select: { id: true, fullName: true, username: true } },
        purchaseItems: {
          include: { product: true },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!purchase) return null

    return {
      ...purchase,
      subtotal: Number(purchase.subtotal),
      discountAmount: Number(purchase.discountAmount),
      taxAmount: Number(purchase.taxAmount),
      grandTotal: Number(purchase.grandTotal),
      paidAmount: Number(purchase.paidAmount),
      dueAmount: Number(purchase.dueAmount),
      purchaseItems: purchase.purchaseItems.map((item) => ({
        ...item,
        unitCost: Number(item.unitCost),
        totalCost: Number(item.totalCost),
        product: {
          ...item.product,
          costPrice: Number(item.product.costPrice),
          sellingPrice: Number(item.product.sellingPrice),
        },
      })),
      payments: purchase.payments.map((pay) => ({
        ...pay,
        amount: Number(pay.amount),
      })),
    }
  },
}
