import { PrismaClient } from '@prisma/client'

// SMO uses the user-provided Turso (SQLite) database file: db/smoid.db
// We hardcode the datasource URL so the app always uses smoid.db
// even if the shell environment sets a different DATABASE_URL.
const SMO_DB_URL = 'file:/home/z/my-project/db/smoid.db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.SMO_DATABASE_URL || SMO_DB_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
