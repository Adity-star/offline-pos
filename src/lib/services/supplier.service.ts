import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface SupplierFilters {
  search?: string
  page?: number
  limit?: number
}

export const supplierService = {
  async getAll(filters: SupplierFilters = {}) {
    const { search, page = 1, limit = 50 } = filters

    const where: Prisma.SupplierWhereInput = search
      ? {
          OR: [
            { name: { contains: search } },
            { mobile: { contains: search } },
            { gstNumber: { contains: search } },
          ],
        }
      : {}

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: { purchases: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.count({ where }),
    ])

    return {
      suppliers: suppliers.map(s => ({
        ...s,
        pendingAmount: Number(s.pendingAmount),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!supplier) return null

    return {
      ...supplier,
      pendingAmount: Number(supplier.pendingAmount),
      purchases: supplier.purchases.map(p => ({
        ...p,
        subtotal: Number(p.subtotal),
        discountAmount: Number(p.discountAmount),
        taxAmount: Number(p.taxAmount),
        grandTotal: Number(p.grandTotal),
        paidAmount: Number(p.paidAmount),
        dueAmount: Number(p.dueAmount),
      })),
      payments: supplier.payments.map(pay => ({
        ...pay,
        amount: Number(pay.amount),
      })),
    }
  },

  async create(data: {
    name: string
    mobile: string
    email?: string
    address?: string
    gstNumber?: string
    notes?: string
  }) {
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email || null,
        address: data.address || null,
        gstNumber: data.gstNumber || null,
        notes: data.notes || null,
      },
    })

    return {
      ...supplier,
      pendingAmount: Number(supplier.pendingAmount),
    }
  },

  async update(
    id: string,
    data: {
      name?: string
      mobile?: string
      email?: string
      address?: string
      gstNumber?: string
      notes?: string
    }
  ) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.mobile && { mobile: data.mobile }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    })

    return {
      ...supplier,
      pendingAmount: Number(supplier.pendingAmount),
    }
  },

  async recordPayment(data: {
    supplierId: string
    amount: number
    paymentMode?: string
    purchaseId?: string
    notes?: string
  }) {
    return prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({
        where: { id: data.supplierId },
      })

      if (!supplier) {
        throw new Error('Supplier not found')
      }

      const currentPending = Number(supplier.pendingAmount)
      const newPending = Math.max(0, currentPending - data.amount)

      await tx.supplier.update({
        where: { id: data.supplierId },
        data: { pendingAmount: newPending },
      })

      const payment = await tx.supplierPayment.create({
        data: {
          supplierId: data.supplierId,
          purchaseId: data.purchaseId || null,
          amount: data.amount,
          paymentMode: data.paymentMode || 'CASH',
          notes: data.notes || null,
        },
      })

      if (data.purchaseId) {
        // Specific purchase voucher payment
        const purchase = await tx.purchase.findUnique({
          where: { id: data.purchaseId },
        })
        if (purchase) {
          const currentPaid = Number(purchase.paidAmount)
          const grandTotal = Number(purchase.grandTotal)
          const newPaid = currentPaid + data.amount
          const newDue = Math.max(0, grandTotal - newPaid)
          const newStatus = newDue === 0 ? 'PAID' : 'PARTIAL'

          await tx.purchase.update({
            where: { id: data.purchaseId },
            data: {
              paidAmount: newPaid,
              dueAmount: newDue,
              paymentStatus: newStatus,
            },
          })
        }
      } else {
        // General payment to supplier: Apply FIFO across all unpaid/partially paid purchases
        const unpaidPurchases = await tx.purchase.findMany({
          where: {
            supplierId: data.supplierId,
            isDeleted: false,
            dueAmount: { gt: 0 },
          },
          orderBy: { createdAt: 'asc' },
        })

        let remainingPayment = data.amount

        for (const purchase of unpaidPurchases) {
          if (remainingPayment <= 0) break

          const due = Number(purchase.dueAmount)
          const payForThis = Math.min(remainingPayment, due)
          const newPaid = Number(purchase.paidAmount) + payForThis
          const newDue = Math.max(0, due - payForThis)
          const newStatus = newDue === 0 ? 'PAID' : 'PARTIAL'

          await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              paidAmount: newPaid,
              dueAmount: newDue,
              paymentStatus: newStatus,
            },
          })

          remainingPayment -= payForThis
        }
      }

      return {
        payment: { ...payment, amount: Number(payment.amount) },
        newPending,
      }
    })
  },
}
