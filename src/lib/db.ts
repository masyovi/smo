import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

// SMO uses a Turso (libsql) database.
// The connection string (with auth token embedded as ?authToken=) lives in
// TURSO_DATABASE_URL inside .env. We use a dedicated env var name (instead of
// DATABASE_URL) because the dev shell sets DATABASE_URL to a local file,
// which would shadow the .env value. TURSO_DATABASE_URL is not set in the
// shell, so .env wins.
//
// IMPORTANT: pass { url, authToken } directly to the PrismaLibSQL adapter
// (NOT a pre-created @libsql/client instance). Passing a pre-created client
// causes the Prisma engine to fail with "URL_INVALID: The URL 'undefined'".
const TURSO_URL = process.env.TURSO_DATABASE_URL

function parseTursoUrl(full: string) {
  // Split the auth token out of the URL so we can pass it separately.
  const url = full.split('?')[0]
  const authToken = full.match(/[?&]authToken=([^&]*)/)?.[1] || undefined
  return { url, authToken }
}

function createPrismaClient() {
  if (TURSO_URL && TURSO_URL.startsWith('libsql://')) {
    const { url, authToken } = parseTursoUrl(TURSO_URL)
    const adapter = new PrismaLibSQL({ url, authToken })
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  }
  // Fallback: local SQLite file (used during offline dev / tests).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient: PC } = require('@prisma/client')
  return new PC({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:/home/z/my-project/db/smoid.db',
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
