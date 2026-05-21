import { NextRequest, NextResponse } from 'next/server'
import { customerService } from '@/lib/services/customer.service'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || ''
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 10
    const customers = await customerService.search(query, limit)
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
