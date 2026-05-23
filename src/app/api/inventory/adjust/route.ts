import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { inventoryService } from '@/lib/services/inventory.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const productId = body.productId as string | undefined
    if (!productId) {
      return NextResponse.json({ error: 'Product is required' }, { status: 400 })
    }

    const rawQuantity = Number(body.quantity)
    if (!Number.isFinite(rawQuantity) || rawQuantity === 0) {
      return NextResponse.json({ error: 'Quantity must be a non-zero number' }, { status: 400 })
    }

    const quantity =
      body.type === 'REMOVE'
        ? -Math.abs(rawQuantity)
        : body.type === 'ADD'
          ? Math.abs(rawQuantity)
          : rawQuantity

    const reason = String(body.reason ?? '').trim()
    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    let userId = body.userId as string | undefined
    if (!userId) {
      const user = await prisma.user.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      if (!user) {
        return NextResponse.json(
          { error: 'No active user found. Run database seed first.' },
          { status: 400 }
        )
      }
      userId = user.id
    }

    const result = await inventoryService.adjustStock({
      productId,
      userId,
      quantity,
      reason,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to adjust stock'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
