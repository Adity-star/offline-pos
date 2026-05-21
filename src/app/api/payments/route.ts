import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/services/payment.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payment = await paymentService.recordPayment(body)
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record payment'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
