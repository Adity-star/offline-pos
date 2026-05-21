import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/services/product.service'
import { categoryService } from '@/lib/services/category.service'

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json()

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Process categories first to get IDs
    const processedProducts = []
    
    // Simple category cache to avoid DB hits
    const categoryCache = new Map<string, string>()

    for (const p of products) {
      let categoryId = ''
      if (p.categoryName) {
        if (categoryCache.has(p.categoryName)) {
          categoryId = categoryCache.get(p.categoryName)!
        } else {
          const cat = await categoryService.getOrCreate(p.categoryName)
          categoryId = cat.id
          categoryCache.set(p.categoryName, cat.id)
        }
      }

      processedProducts.push({
        ...p,
        categoryId,
      })
    }

    const result = await productService.bulkCreate(processedProducts)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}
