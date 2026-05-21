import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  // 1. Setup Admin Account
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Store Admin',
      role: 'ADMIN',
    },
  })
  console.log(`Created user with id: ${admin.id}`)

  // 2. Setup Default Settings if they don't exist
  const existingSettings = await prisma.setting.count()
  if (existingSettings === 0) {
    await prisma.setting.create({
      data: {
        storeName: 'Neural Slate SuperMart',
        storeMobile: '+91 9876543210',
        currencySymbol: '₹',
        taxPercentage: 0,
        printTemplate: 'THERMAL_80MM',
      }
    })
    console.log(`Created default settings`)
  }

  // 3. Setup Default Categories
  const categories = ['Electronics', 'Groceries', 'Clothing', 'Miscellaneous']
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
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
