import { NextResponse } from 'next/server'
import { purchaseService } from '@/lib/services/purchase.service'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q') || searchParams.get('search') || undefined
    const supplierId = searchParams.get('supplierId') || undefined
    const paymentStatus = searchParams.get('paymentStatus') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 30

    const data = await purchaseService.getAll({
      search,
      supplierId,
      paymentStatus,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch purchases:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.supplierName || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier name and at least one item are required' },
        { status: 400 }
      )
    }

    // Default to first active user if userId not supplied
    let userId = body.userId
    if (!userId) {
      const user = await prisma.user.findFirst({ where: { isActive: true } })
      if (!user) {
        return NextResponse.json({ error: 'No active user found in system' }, { status: 400 })
      }
      userId = user.id
    }

    const purchase = await purchaseService.create({
      supplierId: body.supplierId || undefined,
      supplierName: body.supplierName,
      invoiceNumber: body.invoiceNumber || undefined,
      userId,
      items: body.items,
      discountAmount: Number(body.discountAmount) || 0,
      taxAmount: Number(body.taxAmount) || 0,
      paymentMode: body.paymentMode || 'CASH',
      paidAmount: Number(body.paidAmount) || 0,
      notes: body.notes || undefined,
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Failed to create purchase:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create purchase' },
      { status: 500 }
    )
  }
}
