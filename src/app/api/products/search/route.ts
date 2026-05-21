import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/services/product.service'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || ''
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 10
    const products = await productService.search(query, limit)
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
