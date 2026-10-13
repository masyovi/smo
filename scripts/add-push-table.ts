import { createClient } from '@libsql/client'

const c = createClient({ url: process.env.TURSO_DATABASE_URL! })

const stmts = [
  `CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_token_key" ON "PushSubscription"("token")`,
  `CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId")`,
]

for (const s of stmts) {
  try { await c.execute(s); console.log('OK:', s.slice(0, 60).replace(/\n/g, ' ')) }
  catch (e) { console.log('FAIL:', e.message.slice(0, 80)) }
}
console.log('done')
