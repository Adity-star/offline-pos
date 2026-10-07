import { NextResponse } from 'next/server'
import { supplierService } from '@/lib/services/supplier.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q') || searchParams.get('search') || undefined
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 50

    const data = await supplierService.getAll({ search, page, limit })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.name || !body.mobile) {
      return NextResponse.json(
        { error: 'Supplier name and mobile number are required' },
        { status: 400 }
      )
    }

    const supplier = await supplierService.create(body)
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Failed to create supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
