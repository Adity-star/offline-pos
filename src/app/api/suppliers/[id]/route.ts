import { NextResponse } from 'next/server'
import { supplierService } from '@/lib/services/supplier.service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplier = await supplierService.getById(id)
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Failed to get supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get supplier' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supplier = await supplierService.update(id, body)
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Failed to update supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update supplier' },
      { status: 500 }
    )
  }
}
