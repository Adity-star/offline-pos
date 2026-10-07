import { NextResponse } from 'next/server'
import { purchaseService } from '@/lib/services/purchase.service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const purchase = await purchaseService.getById(id)

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Failed to get purchase:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get purchase' },
      { status: 500 }
    )
  }
}
