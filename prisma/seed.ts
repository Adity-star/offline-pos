import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log(`Start seeding ...`)

  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'Store Admin',
      role: 'ADMIN',
    },
  })
  console.log(`Created user with id: ${admin.id}`)

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

  const categories = ['Electronics', 'Groceries', 'Clothing', 'Miscellaneous']
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

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
