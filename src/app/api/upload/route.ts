import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = '/home/z/my-project/public/uploads'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as Record<string, string>

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json(
      { error: 'Permintaan tidak valid (multipart form-data diperlukan)' },
      { status: 400 }
    )
  }
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'File tidak ditemukan pada field "file"' },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Ukuran file melebihi 5MB' },
      { status: 413 }
    )
  }
  const ext = ALLOWED[file.type]
  if (!ext) {
    return NextResponse.json(
      { error: 'Tipe file tidak didukung (hanya JPG, PNG, WebP, GIF)' },
      { status: 415 }
    )
  }
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)
  const buf = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buf)

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 })
}
