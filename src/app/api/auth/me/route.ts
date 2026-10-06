import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ user })
}
