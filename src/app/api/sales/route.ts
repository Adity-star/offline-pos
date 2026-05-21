import { NextRequest, NextResponse } from 'next/server'
import { saleService } from '@/lib/services/sale.service'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const result = await saleService.list({
      search: params.get('search') || undefined,
      customerId: params.get('customerId') || undefined,
      paymentStatus: (params.get('paymentStatus') as any) || undefined,
      dateFrom: params.get('dateFrom') || undefined,
      dateTo: params.get('dateTo') || undefined,
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 20,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sale = await saleService.create(body)
    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create sale'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
