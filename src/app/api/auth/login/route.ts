import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email ?? '').toString().trim().toLowerCase()
    const password = (body?.password ?? '').toString()
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }
    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }
    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })
    await setSessionCookie(token)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        department: user.department,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}
