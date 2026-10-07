import { NextResponse } from 'next/server'
import { supplierService } from '@/lib/services/supplier.service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const amount = Number(body.amount)
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 })
    }

    const result = await supplierService.recordPayment({
      supplierId: id,
      amount,
      paymentMode: body.paymentMode,
      purchaseId: body.purchaseId,
      notes: body.notes,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to record supplier payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record supplier payment' },
      { status: 500 }
    )
  }
}
