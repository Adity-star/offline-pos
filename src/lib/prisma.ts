import 'dotenv/config'

import path from 'path'
import fs from 'fs'

import { PrismaClient } from '@prisma/client'

function getDatabasePath() {
  // ELECTRON PRODUCTION
  if (process.env.APPDATA) {
    const appDir = path.join(
      process.env.APPDATA,
      'ak-software'
    )

    // CREATE DIRECTORY
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, {
        recursive: true,
      })
    }

    return path.join(
      appDir,
      'shop.db'
    )
  }

  // DEV FALLBACK
  return path.join(
    process.cwd(),
    'database',
    'shop.db'
  )
}

const dbPath = getDatabasePath()

console.log('Using database:', dbPath)

// IMPORTANT
process.env.DATABASE_URL =
  `file:${dbPath}`

const globalForPrisma =
  globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '')
}

process.env.DATABASE_URL = `file:${dbPath}`

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}