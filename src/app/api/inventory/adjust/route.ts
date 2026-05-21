import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/lib/services/inventory.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await inventoryService.adjustStock(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to adjust stock'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
