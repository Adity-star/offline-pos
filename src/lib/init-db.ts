import { Prisma } from '@prisma/client'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

import { prisma } from './prisma'

function getDatabasePath(): string {
  const appData =
    process.env.APPDATA ||
    path.join(
      process.env.USERPROFILE || process.cwd(),
      'AppData',
      'Roaming'
    )

  return path.join(
    appData,
    'ak-software',
    'shop.db'
  )
}

function getTemplateDatabasePath(): string {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      'database',
      'shop-template.db'
    )
  }

  return path.join(
    process.cwd(),
    'database',
    'shop-template.db'
  )
}

function ensureDatabaseExists() {
  const dbPath = getDatabasePath()
  const templatePath =
    getTemplateDatabasePath()

  const dbDir = path.dirname(dbPath)

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, {
      recursive: true,
    })
  }

  const exists = fs.existsSync(dbPath)

  const isEmpty =
    exists &&
    fs.statSync(dbPath).size === 0

  if (!exists || isEmpty) {
    console.log(
      'Database does not exist or is empty.'
    )

    console.log(
      'Looking for template:',
      templatePath
    )

    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Database template not found:\n${templatePath}`
      )
    }

    fs.copyFileSync(
      templatePath,
      dbPath
    )

    console.log(
      'Created database from template:',
      dbPath
    )
  }
}

export async function initializeDatabase() {
  console.log(
    'Start database initialization...'
  )

  ensureDatabaseExists()

  const existingSettings =
    await prisma.setting.count()

  if (existingSettings === 0) {
    await prisma.setting.create({
      data: {
        storeName:
          'Neural Slate SuperMart',

        storeAddress: '',

        storePhone:
          '+91 9876543210',

        storeEmail: '',

        invoicePrefix: 'INV',

        taxPercentage:
          new Prisma.Decimal(0),

        currencySymbol: '₹',

        thermalPaperWidth: '80mm',

        allowNegativeStock: false,
      },
    })

    console.log(
      'Created default settings'
    )
  }

  const categories = [
    'Electronics',
    'Miscellaneous',
    'Hardware',
    'Tiles',
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log(
    'Created default categories'
  )

  console.log(
    'Database initialization finished.'
  )
}