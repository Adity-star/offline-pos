import { NextResponse } from 'next/server'
import { dashboardService } from '@/lib/services/dashboard.service'

export async function GET() {
  try {
    const [stats, dailySales, topProducts, monthlySales] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getDailySales(30),
      dashboardService.getTopProducts(10),
      dashboardService.getMonthlySales(12),
    ])

    return NextResponse.json({
      stats,
      dailySales,
      topProducts,
      monthlySales,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}
