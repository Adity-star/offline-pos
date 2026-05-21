import { NextRequest, NextResponse } from 'next/server'
import { customerService } from '@/lib/services/customer.service'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const result = await customerService.list({
      search: params.get('search') || undefined,
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 20,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customer = await customerService.create(body)
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer' },
      { status: 500 }
    )
  }
}
