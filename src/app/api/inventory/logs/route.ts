import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/lib/services/inventory.service'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const result = await inventoryService.getLogs({
      productId: params.get('productId') || undefined,
      actionType: (params.get('actionType') as any) || undefined,
      dateFrom: params.get('dateFrom') || undefined,
      dateTo: params.get('dateTo') || undefined,
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 30,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
