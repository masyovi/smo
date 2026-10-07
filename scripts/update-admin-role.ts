import { createClient } from '@libsql/client'
const url = process.env.TURSO_DATABASE_URL
console.log('URL loaded:', url ? url.slice(0,45)+'...' : 'MISSING')
if (!url) process.exit(1)
const c = createClient({ url })
const r = await c.execute("UPDATE User SET role='TECHNICIAN' WHERE email='admin@smo.com'")
console.log('rows affected:', r.rowsAffected)
const check = await c.execute('SELECT email, role FROM User ORDER BY email')
for (const u of check.rows) console.log('  ', u.email, '->', u.role)
