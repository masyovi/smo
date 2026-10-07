// DEV-ONLY helper: clears the cached PrismaClient singleton so a freshly
// regenerated Prisma client (e.g. after adding the Note model) is picked up
// without having to restart the dev server.
//
// This route is intentionally narrow and only runs in non-production. It is
// a workaround for the case where `prisma generate` updated the generated
// client on disk but the running dev server still holds the OLD PrismaClient
// instance in `globalThis.prisma` (per the singleton pattern in src/lib/db.ts).
//
// Calling this route once clears the singleton. The next request that imports
// `@/lib/db` will trigger Turbopack to re-evaluate `src/lib/db.ts`, which will
// see `globalThis.prisma === undefined` and call `createPrismaClient()` again
// — this time using the freshly generated PrismaClient class (with the new
// model accessors like `db.note`).
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  const g = globalThis as unknown as { prisma?: unknown }
  const had = !!g.prisma
  g.prisma = undefined
  return NextResponse.json({
    ok: true,
    clearedSingleton: had,
    hint: 'Singleton dibersihkan. Modul db.ts akan diinisialisasi ulang pada permintaan berikutnya.',
  })
}

export async function GET() {
  return POST()
}
