import { prisma } from '@/lib/prisma'
import { Prisma, PaymentMode, PaymentStatus, DiscountType } from '@prisma/client'

export interface CreateSaleInput {
  customerId?: string | null
  userId: string
  items: Array<{
    productId: string
    quantity: number
  }>
  discountType: DiscountType
  discountValue: number
  labourCost: number
  taxPercentage: number
  paymentMode: PaymentMode
  paidAmount: number
  notes?: string
}

export interface SaleFilters {
  search?: string
  customerId?: string
  paymentStatus?: PaymentStatus
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const saleService = {
  async create(input: CreateSaleInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch all products and validate stock
      const products = await Promise.all(
        input.items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })
          if (!product) throw new Error(`Product not found: ${item.productId}`)
          if (!product.isActive) throw new Error(`Product is inactive: ${product.name}`)

          // Check stock
          const settings = await tx.setting.findFirst()
          const allowNegative = settings?.allowNegativeStock ?? false
          if (!allowNegative && product.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`
            )
          }

          return { product, quantity: item.quantity }
        })
      )

      // 2. Calculate totals
      let subtotal = 0
      let totalCost = 0
      const saleItems: Array<{
        productId: string
        productName: string
        sku: string
        quantity: number
        unitPrice: Prisma.Decimal
        costPriceAtSale: Prisma.Decimal
        sellingPriceAtSale: Prisma.Decimal
        totalPrice: Prisma.Decimal
        totalCost: Prisma.Decimal
        profit: Prisma.Decimal
      }> = []

      for (const { product, quantity } of products) {
        const itemTotal = Number(product.sellingPrice) * quantity
        const itemCost = Number(product.costPrice) * quantity
        subtotal += itemTotal
        totalCost += itemCost

        saleItems.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitPrice: product.sellingPrice,
          costPriceAtSale: product.costPrice,
          sellingPriceAtSale: product.sellingPrice,
          totalPrice: new Prisma.Decimal(itemTotal),
          totalCost: new Prisma.Decimal(itemCost),
          profit: new Prisma.Decimal(itemTotal - itemCost),
        })
      }

      // 3. Calculate discount
      const discountValue = Number(input.discountValue) || 0
      let discountAmount = 0
      if (input.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * discountValue) / 100
      } else {
        discountAmount = discountValue
      }

      // 4. Calculate tax
      const taxPercentage = Number(input.taxPercentage) || 0
      const taxableAmount = subtotal - discountAmount
      const taxAmount = (taxableAmount * taxPercentage) / 100

      // 5. Calculate grand total
      const grandTotal = taxableAmount + taxAmount + input.labourCost
      const totalProfit = subtotal - totalCost - discountAmount

      // 6. Validate paid amount
      if (input.paidAmount < 0) throw new Error('Paid amount cannot be negative')
      if (input.paidAmount > grandTotal) throw new Error('Paid amount cannot exceed grand total')

      const dueAmount = grandTotal - input.paidAmount
      let paymentStatus: PaymentStatus = 'PAID'
      if (input.paidAmount === 0) paymentStatus = 'UNPAID'
      else if (dueAmount > 0) paymentStatus = 'PARTIAL'

      // 7. Generate invoice number
      const lastSale = await tx.sale.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
      })
      const settings = await tx.setting.findFirst()
      const prefix = settings?.invoicePrefix || 'INV'
      let nextNum = 1
      if (lastSale?.invoiceNumber) {
        const numPart = lastSale.invoiceNumber.replace(/[^0-9]/g, '')
        nextNum = (parseInt(numPart, 10) || 0) + 1
      }
      const invoiceNumber = `${prefix}-${String(nextNum).padStart(6, '0')}`

      // 8. Create sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: input.customerId || null,
          userId: input.userId,
          subtotal: new Prisma.Decimal(subtotal),
          discountType: input.discountType,
          discountValue: new Prisma.Decimal(input.discountValue),
          discountAmount: new Prisma.Decimal(discountAmount),
          labourCost: new Prisma.Decimal(input.labourCost),
          taxAmount: new Prisma.Decimal(taxAmount),
          grandTotal: new Prisma.Decimal(grandTotal),
          totalProfit: new Prisma.Decimal(totalProfit),
          paidAmount: new Prisma.Decimal(input.paidAmount),
          dueAmount: new Prisma.Decimal(dueAmount),
          paymentMode: input.paymentMode,
          paymentStatus,
          notes: input.notes || null,
          saleItems: { create: saleItems },
        },
        include: {
          saleItems: true,
          customer: true,
        },
      })

      // 9. Deduct stock and create inventory logs
      for (const { product, quantity } of products) {
        const newStock = product.currentStock - quantity
        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: newStock },
        })

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            userId: input.userId,
            actionType: 'SALE',
            previousStock: product.currentStock,
            changedQuantity: -quantity,
            newStock,
            referenceType: 'SALE',
            referenceId: sale.id,
            reason: `Sale: ${invoiceNumber}`,
          },
        })
      }

      // 10. Update customer pending balance
      if (input.customerId && dueAmount > 0) {
        await tx.customer.update({
          where: { id: input.customerId },
          data: {
            pendingAmount: {
              increment: new Prisma.Decimal(dueAmount),
            },
          },
        })
      }

      return sale
    })
  },

  async list(filters: SaleFilters = {}) {
    const {
      search,
      customerId,
      paymentStatus,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters

    const where: Prisma.SaleWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search } },
          { customer: { name: { contains: search } } },
        ],
      }),
      ...(customerId && { customerId }),
      ...(paymentStatus && { paymentStatus }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + 'T23:59:59') }),
            },
          }
        : {}),
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          saleItems: true,
          _count: { select: { saleItems: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ])

    return {
      sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        saleItems: {
          include: { product: true },
        },
        payments: true,
      },
    })
  },

  async delete(id: string) {
    // Soft delete - does NOT reverse stock (admin must do manual adjustment)
    return prisma.sale.update({
      where: { id },
      data: { isDeleted: true },
    })
  },
}
