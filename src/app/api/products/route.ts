import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/services/product.service'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const result = await productService.list({
      search: params.get('search') || undefined,
      categoryId: params.get('categoryId') || undefined,
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 20,
      sortBy: params.get('sortBy') || 'createdAt',
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'desc',
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product = await productService.create(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product'
    const status = message.includes('already exists') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
