import 'dotenv/config'
import path from 'path'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? 'file:./database/shop.db'
  if (url.startsWith('file:')) {
    const filePath = url.replace(/^file:/, '')
    return `file:${path.resolve(process.cwd(), filePath)}`
  }
  return url
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl() })
  return new PrismaClient({ adapter, log: ['error'] })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
