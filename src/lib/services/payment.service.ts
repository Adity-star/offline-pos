import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const paymentService = {
  async recordPayment(data: {
    saleId: string
    customerId: string
    amount: number
    paymentMode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT'
    notes?: string
  }) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id: data.saleId } })
      if (!sale) throw new Error('Sale not found')
      if (sale.isDeleted) throw new Error('Cannot pay for a deleted sale')

      const currentDue = Number(sale.dueAmount)
      if (data.amount <= 0) throw new Error('Payment amount must be positive')
      if (data.amount > currentDue) throw new Error('Payment exceeds due amount')

      const newDue = currentDue - data.amount
      const newPaid = Number(sale.paidAmount) + data.amount

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          saleId: data.saleId,
          customerId: data.customerId,
          amount: new Prisma.Decimal(data.amount),
          paymentMode: data.paymentMode,
          notes: data.notes || null,
        },
      })

      // Update sale
      await tx.sale.update({
        where: { id: data.saleId },
        data: {
          paidAmount: new Prisma.Decimal(newPaid),
          dueAmount: new Prisma.Decimal(newDue),
          paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL',
        },
      })

      // Update customer pending
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          pendingAmount: { decrement: new Prisma.Decimal(data.amount) },
        },
      })

      return payment
    })
  },
}
