import { prisma } from '@/lib/prisma'

export const dashboardService = {
  async getStats() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Run queries in parallel
    const [
      todaysSales,
      monthlySales,
      allTimeSales,
      totalCustomers,
      totalProducts,
      pendingAmount,
    ] = await Promise.all([
      // Today's revenue
      prisma.sale.aggregate({
        where: {
          isDeleted: false,
          createdAt: { gte: todayStart },
        },
        _sum: { grandTotal: true, totalProfit: true, labourCost: true },
        _count: { id: true },
      }),
      // Monthly revenue
      prisma.sale.aggregate({
        where: {
          isDeleted: false,
          createdAt: { gte: monthStart },
        },
        _sum: { grandTotal: true, totalProfit: true, labourCost: true },
        _count: { id: true },
      }),
      // All time
      prisma.sale.aggregate({
        where: { isDeleted: false },
        _sum: { grandTotal: true, totalProfit: true, labourCost: true },
        _count: { id: true },
        _avg: { grandTotal: true },
      }),
      // Total customers
      prisma.customer.count(),
      // Total products sold (sum of quantities)
      prisma.saleItem.aggregate({
        _sum: { quantity: true },
      }),
      // Total pending
      prisma.customer.aggregate({
        _sum: { pendingAmount: true },
      }),
    ])

    return {
      todayRevenue: Number(todaysSales._sum.grandTotal ?? 0),
      todaysProfit: Number(todaysSales._sum.totalProfit ?? 0),
      todaysTransactions: todaysSales._count.id,
      todaysLabourCost: Number(todaysSales._sum.labourCost ?? 0),

      monthlyRevenue: Number(monthlySales._sum.grandTotal ?? 0),
      monthlyProfit: Number(monthlySales._sum.totalProfit ?? 0),
      monthlyTransactions: monthlySales._count.id,
      monthlyLabourCost: Number(monthlySales._sum.labourCost ?? 0),

      totalRevenue: Number(allTimeSales._sum.grandTotal ?? 0),
      totalProfit: Number(allTimeSales._sum.totalProfit ?? 0),
      totalTransactions: allTimeSales._count.id,
      totalLabourCost: Number(allTimeSales._sum.labourCost ?? 0),
      avgOrderValue: Number(allTimeSales._avg.grandTotal ?? 0),

      totalCustomers,
      totalProductsSold: totalProducts._sum.quantity ?? 0,
      pendingRecovery: Number(pendingAmount._sum.pendingAmount ?? 0),
    }
  },

  async getDailySales(days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const sales = await prisma.$queryRaw<
      Array<{ date: string; revenue: number; profit: number; count: number }>
    >`
      SELECT
        DATE(createdAt) as date,
        SUM(CAST(grandTotal AS REAL)) as revenue,
        SUM(CAST(totalProfit AS REAL)) as profit,
        COUNT(*) as count
      FROM Sale
      WHERE isDeleted = 0 AND createdAt >= ${startDate.toISOString()}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    return sales.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue ?? 0),
      profit: Number(row.profit ?? 0),
      count: Number(row.count ?? 0),
    }))
  },

  async getTopProducts(limit = 10) {
    const products = await prisma.$queryRaw<
      Array<{ productName: string; totalQuantity: number; totalRevenue: number }>
    >`
      SELECT
        productName,
        SUM(quantity) as totalQuantity,
        SUM(CAST(totalPrice AS REAL)) as totalRevenue
      FROM SaleItem
      GROUP BY productName
      ORDER BY totalQuantity DESC
      LIMIT ${limit}
    `

    return products.map((row, index) => ({
      id: String(index + 1),
      name: row.productName,
      sku: '—',
      _count: { sales: Number(row.totalQuantity ?? 0) },
      totalRevenue: Number(row.totalRevenue ?? 0),
    }))
  },

  async getMonthlySales(months = 12) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const sales = await prisma.$queryRaw<
      Array<{ month: string; revenue: number; profit: number; count: number }>
    >`
      SELECT
        strftime('%Y-%m', createdAt) as month,
        SUM(CAST(grandTotal AS REAL)) as revenue,
        SUM(CAST(totalProfit AS REAL)) as profit,
        COUNT(*) as count
      FROM Sale
      WHERE isDeleted = 0 AND createdAt >= ${startDate.toISOString()}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month ASC
    `

    return sales.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue ?? 0),
      profit: Number(row.profit ?? 0),
      count: Number(row.count ?? 0),
    }))
  },
}
