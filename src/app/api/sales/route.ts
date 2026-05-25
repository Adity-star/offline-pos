import { NextRequest, NextResponse } from 'next/server'

import {
  DiscountType,
  DiscountTypes,
  PaymentMode,
  PaymentModes,
  PaymentStatus,
  PaymentStatuses,
} from '@/types/enums'

import { prisma } from '@/lib/prisma'
import { saleService } from '@/lib/services/sale.service'

function mapDiscountType(type: unknown): DiscountType {
  const value = String(type ?? '').toUpperCase()

  if (
    value === DiscountTypes.PERCENTAGE ||
    value === 'PERCENT'
  ) {
    return DiscountTypes.PERCENTAGE
  }

  return DiscountTypes.FLAT
}

function mapPaymentMode(mode: unknown): PaymentMode {
  const value = String(mode ?? '').toUpperCase()

  switch (value) {
    case PaymentModes.UPI:
      return PaymentModes.UPI

    case PaymentModes.CARD:
      return PaymentModes.CARD

    case PaymentModes.CREDIT:
      return PaymentModes.CREDIT

    default:
      return PaymentModes.CASH
  }
}

function mapPaymentStatus(
  status: unknown
): PaymentStatus | undefined {
  if (!status) return undefined

  const value = String(status).toUpperCase()

  switch (value) {
    case PaymentStatuses.PAID:
      return PaymentStatuses.PAID

    case PaymentStatuses.PARTIAL:
      return PaymentStatuses.PARTIAL

    case PaymentStatuses.UNPAID:
      return PaymentStatuses.UNPAID

    default:
      return undefined
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams

    const result = await saleService.list({
      search: params.get('search') || undefined,

      customerId:
        params.get('customerId') || undefined,

      paymentStatus: mapPaymentStatus(
        params.get('paymentStatus')
      ),

      dateFrom:
        params.get('dateFrom') || undefined,

      dateTo:
        params.get('dateTo') || undefined,

      page: Number(params.get('page')) || 1,

      limit: Number(params.get('limit')) || 20,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /sales error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch sales',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'At least one item is required',
        },
        { status: 400 }
      )
    }

    const settings =
      await prisma.setting.findFirst()

    const taxPercentage = Number(
      settings?.taxPercentage ?? 0
    )

    let userId = body.userId as
      | string
      | undefined

    if (!userId) {
      const user =
        await prisma.user.findFirst({
          where: {
            isActive: true,
          },

          orderBy: {
            createdAt: 'asc',
          },
        })

      if (!user) {
        return NextResponse.json(
          {
            error:
              'No active user found. Run database seed first.',
          },
          { status: 400 }
        )
      }

      userId = user.id
    }

    const sale = await saleService.create({
      customerId:
        body.customerId ?? null,

      userId,

      items: body.items.map(
        (item: {
          productId: string
          quantity: number
        }) => ({
          productId: item.productId,

          quantity:
            Number(item.quantity) || 0,
        })
      ),

      discountType: mapDiscountType(
        body.discountType
      ),

      discountValue:
        Number(body.discountValue) || 0,

      labourCost:
        Number(body.labourCost) || 0,

      taxPercentage:
        Number.isFinite(taxPercentage)
          ? taxPercentage
          : 0,

      paymentMode: mapPaymentMode(
        body.paymentMode
      ),

      paidAmount:
        Number(
          body.paidAmount ??
            body.grandTotal
        ) || 0,

      notes: body.notes ?? undefined,
    })

    return NextResponse.json(sale, {
      status: 201,
    })
  } catch (error) {
    console.error('POST /sales error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create sale',
      },
      { status: 400 }
    )
  }
}