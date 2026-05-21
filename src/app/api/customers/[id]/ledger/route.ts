import { NextRequest, NextResponse } from 'next/server'
import { customerService } from '@/lib/services/customer.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ledger = await customerService.getLedger(id)
    return NextResponse.json(ledger)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ledger' },
      { status: 500 }
    )
  }
}
