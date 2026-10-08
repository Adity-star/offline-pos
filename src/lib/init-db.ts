import { Prisma } from '@prisma/client'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

import { prisma } from './prisma'

function getDatabasePath(): string {
  const isProduction =
    process.env.AK_ENV === 'production' ||
    process.env.NODE_ENV === 'production'

  if (!isProduction) {
    return path.join(
      process.cwd(),
      'database',
      'shop.db'
    )
  }

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

// ---------------------------------------------------
// SCHEMA MIGRATIONS
// Safely add any columns added after initial release.
// SQLite does NOT support IF NOT EXISTS on ALTER TABLE,
// so we check PRAGMA table_info first.
// ---------------------------------------------------

async function runMigrations() {
  console.log('Running schema migrations...')

  // Helper: check if a column exists in a table
  async function columnExists(table: string, column: string): Promise<boolean> {
    const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `PRAGMA table_info(${table})`
    )
    return rows.some((r) => r.name === column)
  }

  // Helper: check if a table exists
  async function tableExists(table: string): Promise<boolean> {
    const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
    )
    return rows.length > 0
  }

  // ── Missing TABLES (added in later migration) ───────
  if (!(await tableExists('Supplier'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Supplier" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "mobile" TEXT NOT NULL,
        "email" TEXT,
        "address" TEXT,
        "gstNumber" TEXT,
        "pendingAmount" DECIMAL NOT NULL DEFAULT 0,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX "Supplier_mobile_idx" ON "Supplier"("mobile")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX "Supplier_name_idx" ON "Supplier"("name")`)
    console.log('Migration: created Supplier table')
  }

  if (!(await tableExists('Purchase'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Purchase" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "purchaseNumber" TEXT NOT NULL,
        "supplierId" TEXT,
        "supplierName" TEXT NOT NULL DEFAULT '',
        "userId" TEXT NOT NULL,
        "subtotal" DECIMAL NOT NULL DEFAULT 0,
        "discountAmount" DECIMAL NOT NULL DEFAULT 0,
        "taxAmount" DECIMAL NOT NULL DEFAULT 0,
        "grandTotal" DECIMAL NOT NULL DEFAULT 0,
        "paidAmount" DECIMAL NOT NULL DEFAULT 0,
        "dueAmount" DECIMAL NOT NULL DEFAULT 0,
        "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
        "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
        "invoiceNumber" TEXT,
        "notes" TEXT,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Purchase_purchaseNumber_key" ON "Purchase"("purchaseNumber")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX "Purchase_paymentStatus_idx" ON "Purchase"("paymentStatus")`)
    console.log('Migration: created Purchase table')
  }

  if (!(await tableExists('PurchaseItem'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "PurchaseItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "purchaseId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "productName" TEXT NOT NULL DEFAULT '',
        "sku" TEXT NOT NULL DEFAULT '',
        "quantity" INTEGER NOT NULL DEFAULT 0,
        "unitCost" DECIMAL NOT NULL DEFAULT 0,
        "totalCost" DECIMAL NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX "PurchaseItem_productId_idx" ON "PurchaseItem"("productId")`)
    console.log('Migration: created PurchaseItem table')
  }

  if (!(await tableExists('SupplierPayment'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "SupplierPayment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "purchaseId" TEXT,
        "supplierId" TEXT NOT NULL,
        "amount" DECIMAL NOT NULL DEFAULT 0,
        "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX "SupplierPayment_supplierId_idx" ON "SupplierPayment"("supplierId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX "SupplierPayment_purchaseId_idx" ON "SupplierPayment"("purchaseId")`)
    console.log('Migration: created SupplierPayment table')
  }

  // ── Product table ──────────────────────────────────
  if (!(await columnExists('Product', 'hsnCode'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Product ADD COLUMN hsnCode TEXT`
    )
    console.log('Migration: added Product.hsnCode')
  }

  if (!(await columnExists('Product', 'barcode'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Product ADD COLUMN barcode TEXT`
    )
    console.log('Migration: added Product.barcode')
  }

  // ── Sale table ─────────────────────────────────────
  if (!(await columnExists('Sale', 'labourCost'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Sale ADD COLUMN labourCost DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added Sale.labourCost')
  }

  if (!(await columnExists('Sale', 'taxAmount'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Sale ADD COLUMN taxAmount DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added Sale.taxAmount')
  }

  if (!(await columnExists('Sale', 'gstPercentage'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Sale ADD COLUMN gstPercentage DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added Sale.gstPercentage')
  }

  if (!(await columnExists('Sale', 'discountType'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Sale ADD COLUMN discountType TEXT NOT NULL DEFAULT 'FLAT'`
    )
    console.log('Migration: added Sale.discountType')
  }

  if (!(await columnExists('Sale', 'totalProfit'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Sale ADD COLUMN totalProfit DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added Sale.totalProfit')
  }

  // ── SaleItem table ─────────────────────────────────
  if (!(await columnExists('SaleItem', 'costPriceAtSale'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE SaleItem ADD COLUMN costPriceAtSale DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added SaleItem.costPriceAtSale')
  }

  if (!(await columnExists('SaleItem', 'sellingPriceAtSale'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE SaleItem ADD COLUMN sellingPriceAtSale DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added SaleItem.sellingPriceAtSale')
  }

  if (!(await columnExists('SaleItem', 'discountPercent'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE SaleItem ADD COLUMN discountPercent DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added SaleItem.discountPercent')
  }

  if (!(await columnExists('SaleItem', 'discountAmount'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE SaleItem ADD COLUMN discountAmount DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added SaleItem.discountAmount')
  }

  if (!(await columnExists('SaleItem', 'totalCost'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE SaleItem ADD COLUMN totalCost DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added SaleItem.totalCost')
  }

  if (!(await columnExists('SaleItem', 'profit'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE SaleItem ADD COLUMN profit DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added SaleItem.profit')
  }

  // ── Setting table ──────────────────────────────────
  if (!(await columnExists('Setting', 'gstNumber'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Setting ADD COLUMN gstNumber TEXT`
    )
    console.log('Migration: added Setting.gstNumber')
  }

  if (!(await columnExists('Setting', 'logoPath'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Setting ADD COLUMN logoPath TEXT`
    )
    console.log('Migration: added Setting.logoPath')
  }

  if (!(await columnExists('Setting', 'bankName'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Setting ADD COLUMN bankName TEXT`
    )
    console.log('Migration: added Setting.bankName')
  }

  if (!(await columnExists('Setting', 'bankAccountName'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Setting ADD COLUMN bankAccountName TEXT`
    )
    console.log('Migration: added Setting.bankAccountName')
  }

  if (!(await columnExists('Setting', 'bankAccountNumber'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Setting ADD COLUMN bankAccountNumber TEXT`
    )
    console.log('Migration: added Setting.bankAccountNumber')
  }

  if (!(await columnExists('Setting', 'bankIfsc'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Setting ADD COLUMN bankIfsc TEXT`
    )
    console.log('Migration: added Setting.bankIfsc')
  }

  if (!(await columnExists('Setting', 'bankBranch'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Setting ADD COLUMN bankBranch TEXT`
    )
    console.log('Migration: added Setting.bankBranch')
  }

  // ── Purchase table ─────────────────────────────────
  if (!(await columnExists('Purchase', 'discountAmount'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Purchase ADD COLUMN discountAmount DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added Purchase.discountAmount')
  }

  if (!(await columnExists('Purchase', 'taxAmount'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Purchase ADD COLUMN taxAmount DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added Purchase.taxAmount')
  }

  if (!(await columnExists('Purchase', 'supplierName'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Purchase ADD COLUMN supplierName TEXT NOT NULL DEFAULT ''`
    )
    console.log('Migration: added Purchase.supplierName')
  }

  if (!(await columnExists('Purchase', 'invoiceNumber'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Purchase ADD COLUMN invoiceNumber TEXT`
    )
    console.log('Migration: added Purchase.invoiceNumber')
  }

  // ── Customer / Supplier pending amount ─────────────
  if (!(await columnExists('Customer', 'pendingAmount'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Customer ADD COLUMN pendingAmount DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added Customer.pendingAmount')
  }

  if (!(await columnExists('Supplier', 'pendingAmount'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE Supplier ADD COLUMN pendingAmount DECIMAL NOT NULL DEFAULT 0`
    )
    console.log('Migration: added Supplier.pendingAmount')
  }

  console.log('Schema migrations complete.')
}

export async function initializeDatabase() {
  console.log(
    'Start database initialization...'
  )

  ensureDatabaseExists()

  // Run schema migrations to patch any existing DB
  await runMigrations()

  const existingSettings =
    await prisma.setting.count()

  if (existingSettings === 0) {
    await prisma.setting.create({
      data: {
        storeName:
          'Jai Hanuman Agency',

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

  await prisma.user.upsert({
    where: {
      username: 'system',
    },

    update: {
      fullName: 'System User',
      role: 'ADMIN',
      isActive: true,
    },

    create: {
      username: 'system',
      password: 'offline-system-user',
      fullName: 'System User',
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log(
    'Ensured default offline system user'
  )


  const categories = [
    'Electronics',
    'Miscellaneous',
    'Hardware',
    "Electrical"
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