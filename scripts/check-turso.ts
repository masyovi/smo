import { createClient } from '@libsql/client'
const c = createClient({ url: process.env.TURSO_DATABASE_URL! })
const r = await c.execute('SELECT COUNT(*) as n FROM Report')
const l = await c.execute('SELECT COUNT(*) as n FROM Location')
const cat = await c.execute('SELECT COUNT(*) as n FROM Category')
const u = await c.execute('SELECT email, role FROM User ORDER BY email')
console.log('Reports:', r.rows[0].n, '| Locations:', l.rows[0].n, '| Categories:', cat.rows[0].n)
console.log('Users:')
for (const x of u.rows) console.log('  ', x.email, '->', x.role)
