import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/lib/services/category.service'

export async function GET() {
  try {
    const categories = await categoryService.list()
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const category = await categoryService.create(body)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create category'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
