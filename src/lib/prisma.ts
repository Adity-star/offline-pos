import 'dotenv/config'

import path from 'path'
import fs from 'fs'

import { PrismaClient } from '@prisma/client'

const isProduction =
  process.env.AK_ENV === 'production' ||
  process.env.NODE_ENV === 'production'

function getDatabasePath(): string {
  if (!isProduction) {
    const databaseDir = path.join(
      process.cwd(),
      'database'
    )

    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, {
        recursive: true,
      })
    }

    return path.join(
      databaseDir,
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

  const appDir = path.join(
    appData,
    'ak-software'
  )

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

const dbPath = getDatabasePath()

const databaseUrl =
  process.platform === 'win32'
    ? `file:${dbPath.replace(/\\/g, '/')}`
    : `file:${dbPath}`

console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('AK_ENV:', process.env.AK_ENV)
console.log('Using database:', dbPath)
console.log('Database URL:', databaseUrl)

const globalForPrisma =
  globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error'],
  })

if (!isProduction) {
  globalForPrisma.prisma = prisma
}