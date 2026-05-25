import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export async function initializeDatabase() {
  console.log(`Start seeding ...`)

  const existingSettings = await prisma.setting.count()

  if (existingSettings === 0) {
    await prisma.setting.create({
      data: {
        storeName: 'Neural Slate SuperMart',
        storeAddress: '',
        storePhone: '+91 9876543210',
        storeEmail: '',
        invoicePrefix: 'INV',
        taxPercentage: new Prisma.Decimal(0),
        currencySymbol: '₹',
        thermalPaperWidth: '80mm',
        allowNegativeStock: false,
      },
    })

    console.log(`Created default settings`)
  }

  const categories = [
    'Electronics',
    'Miscellaneous',
    'Hardware',
    'Tiles'
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log(`Created default categories`)
  console.log(`Seeding finished.`)
}