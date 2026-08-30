import path from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * Prisma resolves `file:` SQLite URLs relative to prisma/schema.prisma, but the
 * generated client can apply that relative path against an unexpected working
 * directory (Windows error 14: "Unable to open the database file"). Resolve the
 * URL to an absolute path up front so dev, scripts, and the standalone server
 * all hit <project-root>/db/custom.db regardless of where the process starts.
 */
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url || !url.startsWith('file:')) return url
  const filePath = url.slice('file:'.length)
  if (path.isAbsolute(filePath)) return url
  return `file:${path.resolve(process.cwd(), 'prisma', filePath)}`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Never log queries: contact form rows contain PII (name/phone/email)
    // and must not be written to plaintext log files in any environment.
    log: ['error', 'warn'],
    datasources: { db: { url: resolveDatabaseUrl() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
