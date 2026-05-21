import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CustomerFilters {
  search?: string
  page?: number
  limit?: number
}

export const customerService = {
  async list(filters: CustomerFilters = {}) {
    const { search, page = 1, limit = 20 } = filters

    const where: Prisma.CustomerWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { mobile: { contains: search } },
        ],
      }),
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ])

    return {
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { saleItems: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
  },

  async create(data: {
    name: string
    mobile: string
    address?: string
    gstNumber?: string
    notes?: string
  }) {
    return prisma.customer.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        address: data.address || null,
        gstNumber: data.gstNumber || null,
        notes: data.notes || null,
      },
    })
  },

  async update(id: string, data: Partial<{
    name: string
    mobile: string
    address: string | null
    gstNumber: string | null
    notes: string | null
  }>) {
    return prisma.customer.update({
      where: { id },
      data,
    })
  },

  async delete(id: string) {
    const salesCount = await prisma.sale.count({ where: { customerId: id } })
    if (salesCount > 0) {
      throw new Error('Cannot delete customer with existing sales records')
    }
    return prisma.customer.delete({ where: { id } })
  },

  async search(query: string, limit = 10) {
    return prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { mobile: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    })
  },

  async getLedger(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id } })
    if (!customer) throw new Error('Customer not found')

    const sales = await prisma.sale.findMany({
      where: { customerId: id, isDeleted: false },
      include: { saleItems: true },
      orderBy: { createdAt: 'desc' },
    })

    const payments = await prisma.payment.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
    })

    const totalPurchases = sales.reduce(
      (sum, s) => sum + Number(s.grandTotal),
      0
    )

    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    ) + sales.reduce(
      (sum, s) => sum + Number(s.paidAmount),
      0
    )

    return {
      customer,
      sales,
      payments,
      totalPurchases,
      totalPaid,
      pendingAmount: Number(customer.pendingAmount),
      lastPurchaseDate: sales[0]?.createdAt || null,
    }
  },
}
