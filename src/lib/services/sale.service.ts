import { prisma } from '@/lib/prisma'

import { Prisma } from '@prisma/client'

import {
  DiscountType,
  DiscountTypes,
  PaymentMode,
  PaymentModes,
  PaymentStatus,
  PaymentStatuses,
  InventoryActionTypes,
} from '@/types/enums'

export interface CreateSaleInput {
  customerId?: string | null

  userId: string

  items: Array<{
    productId: string
    quantity: number
    saleRate?: number
    discountPercent?: number
  }>

  discountType: DiscountType

  discountValue: number

  labourCost: number

  taxPercentage: number

  gstPercentage?: number

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
      // 1. Fetch products & validate stock

      const productsWithItems = await Promise.all(
        input.items.map(async (item) => {
          const product =
            await tx.product.findUnique({
              where: {
                id: item.productId,
              },
            })

          if (!product) {
            throw new Error(
              `Product not found: ${item.productId}`
            )
          }

          if (!product.isActive) {
            throw new Error(
              `Product is inactive: ${product.name}`
            )
          }

          const settings =
            await tx.setting.findFirst()

          const allowNegative =
            settings?.allowNegativeStock ??
            false

          if (
            !allowNegative &&
            product.currentStock <
              item.quantity
          ) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`
            )
          }

          return {
            product,
            quantity: item.quantity,
            saleRate: item.saleRate,
            discountPercent: item.discountPercent,
          }
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

        discountPercent: Prisma.Decimal

        discountAmount: Prisma.Decimal

        totalPrice: Prisma.Decimal

        totalCost: Prisma.Decimal

        profit: Prisma.Decimal
      }> = []

      for (const {
        product,
        quantity,
        saleRate,
        discountPercent,
      } of productsWithItems) {
        const unitPrice = saleRate != null ? Number(saleRate) : Number(product.sellingPrice)
        const discPct = Math.max(0, Math.min(100, Number(discountPercent) || 0))
        const itemGross = unitPrice * quantity
        const itemDiscAmount = (itemGross * discPct) / 100
        const itemNet = itemGross - itemDiscAmount
        const itemCost = Number(product.costPrice) * quantity

        subtotal += itemNet

        totalCost += itemCost

        saleItems.push({
          productId: product.id,

          productName: product.name,

          sku: product.sku,

          quantity,

          unitPrice: new Prisma.Decimal(unitPrice),

          costPriceAtSale: product.costPrice,

          sellingPriceAtSale: new Prisma.Decimal(unitPrice),

          discountPercent: new Prisma.Decimal(discPct),

          discountAmount: new Prisma.Decimal(itemDiscAmount),

          totalPrice: new Prisma.Decimal(itemNet),

          totalCost: new Prisma.Decimal(itemCost),

          profit: new Prisma.Decimal(itemNet - itemCost),
        })
      }

      // 3. Calculate overall discount

      const discountValue =
        Number(input.discountValue) || 0

      let discountAmount = 0

      if (
        input.discountType ===
        DiscountTypes.PERCENTAGE
      ) {
        discountAmount =
          (subtotal * discountValue) /
          100
      } else {
        discountAmount = discountValue
      }

      // 4. Tax calculation (GST Cost %)

      const gstPercentage =
        Number(input.gstPercentage ?? input.taxPercentage ?? input.labourCost) || 0

      const taxableAmount = Math.max(0, subtotal - discountAmount)

      const taxAmount =
        (taxableAmount *
          gstPercentage) /
        100

      // 5. Final totals

      const grandTotal =
        taxableAmount +
        taxAmount

      const totalProfit =
        subtotal -
        totalCost -
        discountAmount

      // 6. Validate payment

      if (input.paidAmount < 0) {
        throw new Error(
          'Paid amount cannot be negative'
        )
      }

      const dueAmount =
        grandTotal - input.paidAmount

      let paymentStatus: PaymentStatus =
        PaymentStatuses.PAID

      if (input.paidAmount === 0) {
        paymentStatus =
          PaymentStatuses.UNPAID
      } else if (dueAmount > 0) {
        paymentStatus =
          PaymentStatuses.PARTIAL
      }

      // 7. Generate invoice number

      const lastSale =
        await tx.sale.findFirst({
          orderBy: {
            createdAt: 'desc',
          },

          select: {
            invoiceNumber: true,
          },
        })

      const settings =
        await tx.setting.findFirst()

      const prefix =
        settings?.invoicePrefix ||
        'INV'

      let nextNum = 1

      if (
        lastSale?.invoiceNumber
      ) {
        const numPart =
          lastSale.invoiceNumber.replace(
            /[^0-9]/g,
            ''
          )

        nextNum =
          (parseInt(numPart, 10) ||
            0) + 1
      }

      const invoiceNumber = `${prefix}-${String(
        nextNum
      ).padStart(6, '0')}`

      // 8. Create sale

      const sale =
        await tx.sale.create({
          data: {
            invoiceNumber,

            customerId:
              input.customerId ||
              null,

            userId: input.userId,

            subtotal:
              new Prisma.Decimal(
                subtotal
              ),

            discountType:
              input.discountType,

            discountValue:
              new Prisma.Decimal(
                input.discountValue
              ),

            discountAmount:
              new Prisma.Decimal(
                discountAmount
              ),

            labourCost:
              new Prisma.Decimal(
                input.labourCost
              ),

            taxAmount:
              new Prisma.Decimal(
                taxAmount
              ),

            gstPercentage:
              new Prisma.Decimal(
                gstPercentage
              ),

            grandTotal:
              new Prisma.Decimal(
                grandTotal
              ),

            totalProfit:
              new Prisma.Decimal(
                totalProfit
              ),

            paidAmount:
              new Prisma.Decimal(
                input.paidAmount
              ),

            dueAmount:
              new Prisma.Decimal(
                dueAmount
              ),

            paymentMode:
              input.paymentMode,

            paymentStatus,

            notes:
              input.notes || null,

            saleItems: {
              create: saleItems,
            },
          },

          include: {
            saleItems: true,

            customer: true,
          },
        })

      // Transform to include customerName for easier frontend access
      return {
        ...sale,
        customerName: sale.customer?.name || 'Walk-in Customer',
      }

      // Transform to include customerName for easier frontend access
      return {
        ...sale,
        customerName: sale.customer?.name || 'Walk-in Customer',
      }

      // 9. Deduct stock & create logs

      for (const {
        product,
        quantity,
      } of productsWithItems) {
        const newStock =
          product.currentStock -
          quantity

        await tx.product.update({
          where: {
            id: product.id,
          },

          data: {
            currentStock: newStock,
          },
        })

        await tx.inventoryLog.create({
          data: {
            productId: product.id,

            userId: input.userId,

            actionType:
              InventoryActionTypes.SALE,

            previousStock:
              product.currentStock,

            changedQuantity:
              -quantity,

            newStock,

            referenceType: 'SALE',

            referenceId: sale.id,

            reason: `Sale: ${invoiceNumber}`,
          },
        })
      }

      // 10. Update customer due

      if (
        input.customerId != null &&
        dueAmount > 0
      ) {
        await tx.customer.update({
          where: {
            id: input.customerId,
          },

          data: {
            pendingAmount: {
              increment:
                new Prisma.Decimal(
                  dueAmount
                ),
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

    const where: Prisma.SaleWhereInput =
      {
        isDeleted: false,

        ...(search && {
          OR: [
            {
              invoiceNumber: {
                contains: search,
              },
            },

            {
              customer: {
                name: {
                  contains: search,
                },
              },
            },
          ],
        }),

        ...(customerId && {
          customerId,
        }),

        ...(paymentStatus && {
          paymentStatus,
        }),

        ...(dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom && {
                  gte: new Date(
                    dateFrom
                  ),
                }),

                ...(dateTo && {
                  lte: new Date(
                    `${dateTo}T23:59:59`
                  ),
                }),
              },
            }
          : {}),
      }

    const [sales, total] =
      await Promise.all([
        prisma.sale.findMany({
          where,

          include: {
            customer: true,

            saleItems: true,

            _count: {
              select: {
                saleItems: true,
              },
            },
          },

          skip:
            (page - 1) * limit,

          take: limit,

          orderBy: {
            createdAt: 'desc',
          },
        }),

        prisma.sale.count({
          where,
        }),
      ])

    // Transform sales to include customerName for easier frontend access
    const transformedSales = sales.map(sale => ({
      ...sale,
      customerName: sale.customer?.name || 'Walk-in Customer',
    }))

    return {
      sales: transformedSales,

      total,

      page,

      limit,

      totalPages: Math.ceil(
        total / limit
      ),
    }
  },

  async getById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: {
        id,
      },

      include: {
        customer: true,

        user: true,

        saleItems: {
          include: {
            product: true,
          },
        },

        payments: true,
      },
    })

    if (!sale) return null

    // Transform to include customerName for easier frontend access
    return {
      ...sale,
      customerName: sale.customer?.name || 'Walk-in Customer',
    }
  },

  async delete(id: string) {
    return prisma.sale.update({
      where: {
        id,
      },

      data: {
        isDeleted: true,
      },
    })
  },
}